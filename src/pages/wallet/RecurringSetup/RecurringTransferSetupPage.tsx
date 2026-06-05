import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { RECENT_USERS_MOCK, type RecentUser } from '@/mocks/transferMock';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import styles from './RecurringTransferSetupPage.module.css';

const RECENT_USERS = RECENT_USERS_MOCK.result;
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const TONE_CLASS: Record<string, string> = {
  best: 'avatarBest',
  good: 'avatarGood',
  mid: 'avatarMid',
  warn: 'avatarWarn',
  bad: 'avatarBad',
};

export default function RecurringTransferSetupPage() {
  const navigate = useNavigate();
  const { data: currenciesData, isLoading: currenciesLoading } = useTransferSupportedCurrencies();
  const currencies = currenciesData?.currencies ?? [];

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

  return (
    <div className={styles.contentPad}>
      <TopBar title="정기 송금 설정" />

      {/* 송금 대상 */}
      <div className={styles.field}>
        <label htmlFor="recipient">송금 대상</label>
        <button
          id="recipient"
          type="button"
          className={styles.select}
          onClick={() => setRecipientOpen((prev) => !prev)}
        >
          <span>{recipient ? `${recipient.name} · 앱 사용자` : '대상 선택'}</span>
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
        <label>송금 통화 / 금액</label>
        <div className={styles.amountRow}>
          <select
            className={styles.selectNative}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currenciesLoading ? (
              <option value="">불러오는 중...</option>
            ) : (
              currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))
            )}
          </select>
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
        <label>송금 일정</label>
        <select
          className={styles.selectNative}
          value={scheduleType}
          onChange={(e) => {
            setScheduleType(e.target.value);
            setScheduleDay('');
          }}
        >
          <option value="">일정 선택</option>
          <option value="매일">매일</option>
          <option value="매주">매주</option>
          <option value="매월">매월</option>
        </select>
        {scheduleType === '매주' && (
          <div className={styles.subField}>
            <select
              className={styles.selectNative}
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            >
              <option value="">요일 선택</option>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}요일
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
              <option value="">날짜 선택</option>
              {MONTH_DAYS.map((d) => (
                <option key={d} value={String(d)}>
                  {d}일
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 시작일 */}
      <div className={styles.field}>
        <label htmlFor="start-date">시작일</label>
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
        <label>종료 조건</label>
        <select
          className={styles.selectNative}
          value={endType}
          onChange={(e) => {
            setEndType(e.target.value);
            setEndCount('');
            setEndDate('');
          }}
        >
          <option value="">종료 조건 선택</option>
          <option value="무기한">해지 전까지 반복</option>
          <option value="횟수">횟수 제한</option>
          <option value="날짜">날짜 지정</option>
        </select>
        {endType === '횟수' && (
          <div className={styles.subField}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="반복 횟수 입력 (예: 12)"
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
        <div className={styles.cardTitle}>정기 송금 안내</div>
        <div className={styles.cardText}>
          송금일 전 알림이 발송되며, 잔액 부족 시 송금이 실패할 수 있습니다.
        </div>
      </div>

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canSubmit}
          onClick={() => navigate('/recurring/complete')}
        >
          정기 송금 설정하기
        </button>
      </div>
    </div>
  );
}
