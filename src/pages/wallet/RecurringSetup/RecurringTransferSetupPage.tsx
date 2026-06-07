import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { RECENT_USERS_MOCK, type RecentUser } from '@/mocks/transferMock';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import styles from './RecurringTransferSetupPage.module.css';

const RECENT_USERS = RECENT_USERS_MOCK.result;
// 요일은 ISO key — display는 i18n.
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const TONE_CLASS: Record<string, string> = {
  best: 'avatarBest',
  good: 'avatarGood',
  mid: 'avatarMid',
  warn: 'avatarWarn',
  bad: 'avatarBad',
};

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

  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipient, setRecipient] = useState<RecentUser | null>(null);
  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [scheduleType, setScheduleType] = useState('');
  const [scheduleDay, setScheduleDay] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endType, setEndType] = useState('');
  const [endCount, setEndCount] = useState('');
  const [endDate, setEndDate] = useState('');

  const canSubmit =
    recipient !== null &&
    Number(amount) > 0 &&
    scheduleType !== '' &&
    startDate !== '' &&
    endType !== '';

  function handleSelectRecipient(user: RecentUser) {
    setRecipient(user);
    setRecipientOpen(false);
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
      <TopBar title={t('recurring.setup.title')} />

      {/* 송금 대상 */}
      <div className={styles.field}>
        <label htmlFor="recipient">{t('recurring.setup.recipientLabel')}</label>
        <button
          id="recipient"
          type="button"
          className={styles.select}
          onClick={() => setRecipientOpen((prev) => !prev)}
        >
          <span>
            {recipient
              ? t('recurring.setup.recipientPicked', { name: recipient.name })
              : t('recurring.setup.recipientPlaceholder')}
          </span>
          <span aria-hidden>{recipientOpen ? '▴' : '▾'}</span>
        </button>
        {recipientOpen && (
          <div className={styles.recipientList}>
            {RECENT_USERS.map((user) => (
              <div
                key={user.email}
                className={styles.recipientItem}
                onClick={() => handleSelectRecipient(user)}
              >
                <div className={`${styles.avatar} ${styles[TONE_CLASS[user.tone]]}`}>
                  {user.initial}
                </div>
                <div>
                  <div className={styles.recipientName}>{user.name}</div>
                  <div className={styles.recipientMeta}>{user.currency}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 송금 통화 / 금액 */}
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

      {/* 송금 일정 */}
      <div className={styles.field}>
        <label>{t('recurring.setup.scheduleLabel')}</label>
        <select
          className={styles.selectNative}
          value={scheduleType}
          onChange={(e) => {
            setScheduleType(e.target.value);
            setScheduleDay('');
          }}
        >
          <option value="">{t('recurring.setup.schedulePlaceholder')}</option>
          <option value="매일">{t('recurring.setup.scheduleDaily')}</option>
          <option value="매주">{t('recurring.setup.scheduleWeekly')}</option>
          <option value="매월">{t('recurring.setup.scheduleMonthly')}</option>
        </select>
        {scheduleType === '매주' && (
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
        {scheduleType === '매월' && (
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

      {/* 시작일 */}
      <div className={styles.field}>
        <label htmlFor="start-date">{t('recurring.setup.startDateLabel')}</label>
        <input
          id="start-date"
          type="date"
          className={styles.input}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* 종료 조건 */}
      <div className={styles.field}>
        <label>{t('recurring.setup.endLabel')}</label>
        <select
          className={styles.selectNative}
          value={endType}
          onChange={(e) => {
            setEndType(e.target.value);
            setEndCount('');
            setEndDate('');
          }}
        >
          <option value="">{t('recurring.setup.endPlaceholder')}</option>
          <option value="무기한">{t('recurring.setup.endNever')}</option>
          <option value="횟수">{t('recurring.setup.endCount')}</option>
          <option value="날짜">{t('recurring.setup.endDate')}</option>
        </select>
        {endType === '횟수' && (
          <div className={styles.subField}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder={t('recurring.setup.endCountPlaceholder')}
              value={endCount}
              onChange={(e) => setEndCount(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        )}
        {endType === '날짜' && (
          <div className={styles.subField}>
            <input
              type="date"
              className={styles.input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>{t('recurring.setup.noticeTitle')}</div>
        <div className={styles.cardText}>{t('recurring.setup.noticeText')}</div>
      </div>

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canSubmit}
          onClick={() => navigate('/recurring/complete')}
        >
          {t('recurring.setup.submit')}
        </button>
      </div>
    </div>
  );
}
