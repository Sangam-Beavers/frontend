import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useRecentInternalRecipients } from '@/hooks/useRecentInternalRecipients';
import { useValidateMember } from '@/hooks/useValidateMember';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import styles from './TransferAppPage.module.css';

// 아바타 색상 톤 — mock에서 들고 있던 5색 그대로. 백엔드는 톤을 안 주므로 인덱스로 순환 매핑.
type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad';
const TONES: AvatarTone[] = ['best', 'good', 'mid', 'warn', 'bad'];

const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
};

/** 화면에서 다루는 수신자 표시 모델 — API 응답에서 파생. */
interface RecipientDisplay {
  identifier: string; // nickname (검증/송금 API용 식별자는 다음 PR에서 member_public_id로 교체 검토)
  name: string;
  initial: string;
  currency: string;
  tone: AvatarTone;
}

export default function TransferAppPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 통화 드롭다운 (#120 패턴)
  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useTransferSupportedCurrencies();
  const currencies = currenciesData?.currencies ?? [];
  const hasCurrenciesError = currenciesError != null;

  // 최근 송금 앱 사용자 (#122 신규)
  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch: refetchRecipients,
  } = useRecentInternalRecipients();
  const hasRecipientsError = recipientsError != null;

  // API 응답 → 화면용 모델 변환. tone은 인덱스 순환.
  const recentRecipients: RecipientDisplay[] = useMemo(() => {
    const list = recipientsData?.receivers ?? [];
    return list.map((r, idx) => ({
      identifier: r.nickname,
      name: r.nickname,
      initial: r.nickname.charAt(0).toUpperCase() || '?',
      currency: r.last_currency_code,
      tone: TONES[idx % TONES.length],
    }));
  }, [recipientsData]);

  const [recipient, setRecipient] = useState('');
  const [verified, setVerified] = useState<RecipientDisplay | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // 검증 mutation (#131) — 사용자가 "확인" 누를 때 1회 호출.
  const validateMutation = useValidateMember();
  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  function handleVerify() {
    setVerifyError(null);
    const trimmed = recipient.trim();
    if (!trimmed) {
      setVerifyError(t('transfer.app.errorEmailRequired'));
      return;
    }
    validateMutation.mutate(trimmed, {
      onSuccess: (res) => {
        // 응답엔 닉네임/is_verified/receiver_public_id가 들어옴. 화면 모델로 변환.
        // receiver_public_id는 verified state의 identifier 필드에 저장 — 송금 실행 시 식별자로 사용 예정.
        setVerified({
          identifier: res.receiver_public_id,
          name: res.nickname,
          initial: res.nickname.charAt(0).toUpperCase() || '?',
          // 통화는 백엔드 응답에 없음 → 현재 selectedCurrency 유지 (사용자가 따로 선택).
          currency,
          tone: 'good',
        });
      },
      onError: (err) => {
        setVerified(null);
        if (err instanceof ApiException) {
          if (err.code === 'COMMON4001') setVerifyError(t('transfer.app.errorInvalidEmail'));
          else if (err.code === 'MEMBER4001') setVerifyError(t('transfer.app.errorMemberNotFound'));
          else if (err.code === 'NETWORK_ERROR') setVerifyError(t('transfer.app.errorNetwork'));
          else setVerifyError(err.message || t('transfer.app.errorVerifyFailed'));
        } else {
          setVerifyError(t('transfer.app.errorVerifyFailed'));
        }
      },
    });
  }

  function handleRecentSelect(user: RecipientDisplay) {
    setRecipient(user.identifier);
    setVerified(user);
    setCurrency(user.currency);
  }

  const canSubmit = verified !== null && Number(amount) > 0;

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('transfer.app.title')} onBack={() => navigate('/transfer')} />

        <div className={styles.section}>{t('transfer.app.recentSection')}</div>

        {/* 최근 수신자 칩 — 로딩/에러/빈 상태 처리 (#120 패턴) */}
        {recipientsLoading ? (
          <div className={styles.emptyText}>{t('transfer.app.loading')}</div>
        ) : hasRecipientsError ? (
          <div className={styles.emptyText}>
            {t('transfer.app.recentLoadError')}
            <button type="button" className={styles.retryBtn} onClick={() => refetchRecipients()}>
              {t('transfer.app.retry')}
            </button>
          </div>
        ) : recentRecipients.length === 0 ? (
          <div className={styles.emptyText}>{t('transfer.app.recentEmpty')}</div>
        ) : (
          <div className={styles.scrollRow}>
            {recentRecipients.map((user) => (
              <div
                key={user.identifier}
                className={styles.recentCard}
                onClick={() => handleRecentSelect(user)}
              >
                <div className={`${styles.avatar} ${AVATAR_CLASS[user.tone]}`}>{user.initial}</div>
                <div className={styles.recentName}>{user.name}</div>
                <div className={styles.recentCurrency}>{user.currency}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>{t('transfer.app.recipientEmailLabel')}</label>
          <div className={styles.inputRow}>
            <input
              type="email"
              placeholder={t('transfer.app.recipientEmailPlaceholder')}
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
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
              {validateMutation.isPending ? t('transfer.app.verifying') : t('transfer.app.verify')}
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
            <div className={`${styles.avatar} ${AVATAR_CLASS[verified.tone]}`}>
              {verified.initial}
            </div>
            <div className={styles.verifiedInfo}>
              <div className={styles.verifiedName}>
                {verified.name}
                <span className={styles.pill}>{t('transfer.app.verifiedBadge')}</span>
              </div>
              <div className={styles.verifiedMeta}>{t('transfer.app.verifiedMeta')}</div>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-currency">
            {t('transfer.app.currencyLabel')}
          </label>
          <select
            id="transfer-currency"
            className={styles.select}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currenciesLoading || hasCurrenciesError || currencies.length === 0}
          >
            {currenciesLoading && <option value="">{t('transfer.app.loading')}</option>}
            {hasCurrenciesError && <option value="">{t('transfer.app.currencyLoadError')}</option>}
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
              {t('transfer.app.retry')}
            </button>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            {t('transfer.app.amountLabel')}
          </label>
          <input
            id="transfer-amount"
            type="number"
            className={styles.input}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-memo">
            {t('transfer.app.memoLabel')}
          </label>
          <input
            id="transfer-memo"
            type="text"
            className={styles.input}
            placeholder={t('transfer.app.memoPlaceholder')}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() => navigate('/transfer/confirm')}
        >
          {t('transfer.app.next')}
        </button>
      </div>
    </>
  );
}
