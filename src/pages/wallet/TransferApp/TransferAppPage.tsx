import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { TRANSFER_CURRENCIES } from '@/constants/currencies';
import { RECENT_USERS_MOCK, type AvatarTone, type RecentUser } from '@/mocks/transferMock';
import styles from './TransferAppPage.module.css';

const RECENT_USERS = RECENT_USERS_MOCK.result;
const CURRENCIES = TRANSFER_CURRENCIES;

const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
};

export default function TransferAppPage() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState('');
  const [verified, setVerified] = useState<RecentUser | null>(null);
  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  function handleVerify() {
    const found = RECENT_USERS.find(
      (u) => u.email === recipient || u.name.toLowerCase() === recipient.toLowerCase()
    );
    setVerified(found ?? null);
  }

  function handleRecentSelect(user: RecentUser) {
    setRecipient(user.email);
    setVerified(user);
    setCurrency(user.currency);
  }

  const canSubmit = verified !== null && Number(amount) > 0;

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="앱 사용자 송금" onBack={() => navigate('/transfer')} />

        <div className={styles.section}>최근 송금한 대상</div>

        <div className={styles.scrollRow}>
          {RECENT_USERS.map((user) => (
            <div
              key={user.name}
              className={styles.recentCard}
              onClick={() => handleRecentSelect(user)}
            >
              <div className={`${styles.avatar} ${AVATAR_CLASS[user.tone]}`}>{user.initial}</div>
              <div className={styles.recentName}>{user.name}</div>
              <div className={styles.recentCurrency}>{user.currency}</div>
            </div>
          ))}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>받는 사람 이메일 / 아이디</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="이메일 또는 아이디 입력"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setVerified(null);
              }}
            />
            <button type="button" className={styles.inputAction} onClick={handleVerify}>
              확인
            </button>
          </div>
        </div>

        {verified && (
          <div className={styles.verifiedCard}>
            <div className={`${styles.avatar} ${AVATAR_CLASS[verified.tone]}`}>
              {verified.initial}
            </div>
            <div className={styles.verifiedInfo}>
              <div className={styles.verifiedName}>
                {verified.name}
                <span className={styles.pill}>인증</span>
              </div>
              <div className={styles.verifiedMeta}>친절한 온도 매우 좋음 · 베트남어</div>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-currency">
            보낼 통화
          </label>
          <select
            id="transfer-currency"
            className={styles.select}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            보낼 금액
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
            메모
          </label>
          <input
            id="transfer-memo"
            type="text"
            className={styles.input}
            placeholder="메모 (선택)"
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
          다음
        </button>
      </div>
    </>
  );
}
