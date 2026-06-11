import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { ApiException } from '@/api';
import type { CreateScheduledTransferRequest, ScheduledTransferFrequency } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import { useCreateScheduled } from '@/hooks/useCreateScheduled';
import { useRecentInternalRecipients } from '@/hooks/useRecentInternalRecipients';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import { useValidateMember } from '@/hooks/useValidateMember';
import { useValidateScheduled } from '@/hooks/useValidateScheduled';
import styles from './RecurringTransferSetupPage.module.css';

type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad';
const TONES: AvatarTone[] = ['best', 'good', 'mid', 'warn', 'bad'];
const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
};

interface RecipientDisplay {
  identifier: string;
  name: string;
  initial: string;
  tone: AvatarTone;
}

type ScheduleType = '' | 'WEEKLY_PICK' | 'MONTHLY_PICK';
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function RecurringTransferSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useTransferSupportedCurrencies();
  const currencies = currenciesData?.currencies ?? [];
  const hasCurrenciesError = currenciesError != null;

  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch: refetchRecipients,
  } = useRecentInternalRecipients();
  const hasRecipientsError = recipientsError != null;

  const recentRecipients: RecipientDisplay[] = useMemo(() => {
    const list = recipientsData?.receivers ?? [];
    return list.map((r, idx) => ({
      identifier: r.member_public_id,
      name: r.nickname,
      initial: r.nickname.charAt(0).toUpperCase() || '?',
      tone: TONES[idx % TONES.length],
    }));
  }, [recipientsData]);

  const [emailInput, setEmailInput] = useState('');
  const [verified, setVerified] = useState<RecipientDisplay | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const validateMutation = useValidateMember();

  function handleVerify() {
    setVerifyError(null);
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setVerifyError(t('recurring.setup.verifyErrEmpty'));
      return;
    }
    validateMutation.mutate(trimmed, {
      onSuccess: (res) => {
        setVerified({
          identifier: res.receiver_public_id,
          name: res.nickname,
          initial: res.nickname.charAt(0).toUpperCase() || '?',
          tone: 'good',
        });
      },
      onError: (err) => {
        setVerified(null);
        if (err instanceof ApiException) {
          if (err.code === 'COMMON4001') setVerifyError(t('recurring.setup.verifyErrFormat'));
          else if (err.code === 'MEMBER4001')
            setVerifyError(t('recurring.setup.verifyErrNotFound'));
          else setVerifyError(err.message || t('recurring.setup.verifyErrGeneric'));
        } else {
          setVerifyError(t('recurring.setup.verifyErrGeneric'));
        }
      },
    });
  }

  function handleRecentSelect(user: RecipientDisplay) {
    setEmailInput('');
    setVerified(user);
    setVerifyError(null);
  }

  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('');
  const [scheduleDay, setScheduleDay] = useState('');
  const [memo, setMemo] = useState('');

  const validateScheduled = useValidateScheduled();
  const createScheduled = useCreateScheduled();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = validateScheduled.isPending || createScheduled.isPending;

  const canSubmit =
    verified !== null &&
    currency !== '' &&
    Number(amount) > 0 &&
    scheduleType !== '' &&
    scheduleDay !== '';

  function buildRequest(): CreateScheduledTransferRequest | null {
    if (!verified) return null;
    const frequency: ScheduledTransferFrequency =
      scheduleType === 'WEEKLY_PICK' ? 'WEEKLY' : 'MONTHLY';
    const day =
      scheduleType === 'WEEKLY_PICK'
        ? (WEEKDAY_KEYS as readonly string[]).indexOf(scheduleDay) + 1
        : Number(scheduleDay);
    if (!day || day < 1) return null;
    return {
      transfer_type: 'INTERNAL_TRANSFER',
      receiver_public_id: verified.identifier,
      amount: String(amount),
      currency_code: currency,
      receive_currency_code: currency,
      frequency,
      schedule_day: day,
      memo: memo.trim() ? memo.trim() : null,
    };
  }

  function handleSubmit() {
    setSubmitError(null);
    const body = buildRequest();
    if (!body) {
      setSubmitError(t('recurring.setup.errInput'));
      return;
    }
    validateScheduled.mutate(body, {
      onSuccess: (res) => {
        if (!res.is_valid) {
          setSubmitError(res.reason ?? t('recurring.setup.errValidate'));
          return;
        }
        createScheduled.mutate(body, {
          onSuccess: (created) => {
            navigate('/recurring/complete', {
              state: { scheduled: created, recipientName: verified?.name ?? null },
            });
          },
          onError: (err) => {
            if (err instanceof ApiException) {
              setSubmitError(err.message || t('recurring.setup.errCreate'));
            } else {
              setSubmitError(t('recurring.setup.errCreate'));
            }
          },
        });
      },
      onError: (err) => {
        if (err instanceof ApiException) {
          setSubmitError(err.message || t('recurring.setup.errInput'));
        } else {
          setSubmitError(t('recurring.setup.errValidateFmt'));
        }
      },
    });
  }

  const weekdayLabels: Record<(typeof WEEKDAY_KEYS)[number], string> = {
    mon: t('recurring.setup.weekdayMon'),
    tue: t('recurring.setup.weekdayTue'),
    wed: t('recurring.setup.weekdayWed'),
    thu: t('recurring.setup.weekdayThu'),
    fri: t('recurring.setup.weekdayFri'),
    sat: t('recurring.setup.weekdaySat'),
    sun: t('recurring.setup.weekdaySun'),
  };

  return (
    <div className={styles.contentPad}>
      <TopBar title={t('recurring.setup.title')} onBack={() => navigate(ROUTES.RECURRING)} />

      <div className={styles.section}>{t('recurring.setup.recentSection')}</div>
      {recipientsLoading ? (
        <div className={styles.emptyText}>{t('recurring.setup.recentLoading')}</div>
      ) : hasRecipientsError ? (
        <div className={styles.emptyText}>
          {t('recurring.setup.recentError')}
          <button type="button" className={styles.retryBtn} onClick={() => refetchRecipients()}>
            {t('recurring.setup.recentRetry')}
          </button>
        </div>
      ) : recentRecipients.length === 0 ? (
        <div className={styles.emptyText}>{t('recurring.setup.recentEmpty')}</div>
      ) : (
        <div className={styles.scrollRow}>
          {recentRecipients.map((user) => (
            <button
              key={user.identifier}
              type="button"
              className={styles.recentCard}
              onClick={() => handleRecentSelect(user)}
            >
              <div className={`${styles.avatarBig} ${AVATAR_CLASS[user.tone]}`}>{user.initial}</div>
              <div className={styles.recentName}>{user.name}</div>
            </button>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>{t('recurring.setup.emailLabel')}</label>
        <div className={styles.inputRow}>
          <input
            type="email"
            placeholder={t('recurring.setup.emailPlaceholder')}
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setVerified(null);
              setVerifyError(null);
            }}
          />
          <button
            type="button"
            className={styles.inputAction}
            onClick={handleVerify}
            disabled={validateMutation.isPending}
          >
            {validateMutation.isPending
              ? t('recurring.setup.verifying')
              : t('recurring.setup.verify')}
          </button>
        </div>
        {verifyError && (
          <div className={styles.errorText} role="alert">
            {verifyError}
          </div>
        )}
      </div>

      {verified && (
        <div className={styles.verifiedCard}>
          <div className={`${styles.avatarBig} ${AVATAR_CLASS[verified.tone]}`}>
            {verified.initial}
          </div>
          <div className={styles.verifiedInfo}>
            <div className={styles.verifiedName}>
              {verified.name}
              <span className={styles.pill}>{t('recurring.setup.verifiedBadge')}</span>
            </div>
            <div className={styles.verifiedMeta}>{t('recurring.setup.verifiedMethod')}</div>
          </div>
        </div>
      )}

      <div className={styles.field}>
        <label>{t('recurring.setup.amountLabel')}</label>
        <div className={styles.amountRow}>
          <select
            className={styles.selectNative}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currenciesLoading || hasCurrenciesError || currencies.length === 0}
          >
            {currenciesLoading && (
              <option value="">{t('recurring.setup.currenciesLoading')}</option>
            )}
            {hasCurrenciesError && <option value="">{t('recurring.setup.currenciesError')}</option>}
            {!currenciesLoading &&
              !hasCurrenciesError &&
              currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
          </select>
          {hasCurrenciesError && (
            <button type="button" className={styles.retryBtn} onClick={() => refetchCurrencies()}>
              {t('recurring.setup.retry')}
            </button>
          )}
          <input
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label>{t('recurring.setup.scheduleLabel')}</label>
        <select
          className={styles.selectNative}
          value={scheduleType}
          onChange={(e) => {
            setScheduleType(e.target.value as ScheduleType);
            setScheduleDay('');
          }}
        >
          <option value="">{t('recurring.setup.scheduleSelect')}</option>
          <option value="WEEKLY_PICK">{t('recurring.setup.weekly')}</option>
          <option value="MONTHLY_PICK">{t('recurring.setup.monthly')}</option>
        </select>
        {scheduleType === 'WEEKLY_PICK' && (
          <div className={styles.subField}>
            <select
              className={styles.selectNative}
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            >
              <option value="">{t('recurring.setup.weekdayPlaceholder')}</option>
              {WEEKDAY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {weekdayLabels[key]}
                </option>
              ))}
            </select>
          </div>
        )}
        {scheduleType === 'MONTHLY_PICK' && (
          <div className={styles.subField}>
            <select
              className={styles.selectNative}
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            >
              <option value="">{t('recurring.setup.datePlaceholder')}</option>
              {MONTH_DAYS.map((d) => (
                <option key={d} value={String(d)}>
                  {t('recurring.setup.dayOfMonth', { day: d })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="recurring-memo">
          {t('recurring.setup.memoLabel')}
        </label>
        <input
          id="recurring-memo"
          type="text"
          className={styles.input}
          placeholder={t('recurring.setup.memoPlaceholder')}
          maxLength={255}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>{t('recurring.setup.noticeTitle')}</div>
        <div className={styles.cardText}>{t('recurring.setup.noticeTextNew')}</div>
      </div>

      {submitError && (
        <div className={styles.errorText} role="alert">
          {submitError}
        </div>
      )}

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? t('recurring.setup.submitting') : t('recurring.setup.submitLabel')}
        </button>
      </div>
    </div>
  );
}
