import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './TransferAppPage.module.css';

interface RecentUser {
  initial: string;
  name: string;
  currency: string;
  avatarClass: string;
  email: string;
}

const RECENT_USERS: RecentUser[] = [
  {
    initial: 'L',
    name: 'Linh',
    currency: 'VND',
    avatarClass: styles.avatarBest,
    email: 'linh@email.com',
  },
  {
    initial: 'M',
    name: 'Minh',
    currency: 'USD',
    avatarClass: styles.avatarGood,
    email: 'minh@email.com',
  },
  {
    initial: 'A',
    name: 'Anna',
    currency: 'KRW',
    avatarClass: styles.avatarMid,
    email: 'anna@email.com',
  },
];

const CURRENCIES = [
  { code: 'VND', label: '베트남 동' },
  { code: 'KRW', label: '원화' },
  { code: 'USD', label: '달러' },
  { code: 'THB', label: '바트' },
  { code: 'CNY', label: '위안' },
];

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

  const canSubmit = verified !== null && amount !== '';

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="앱 사용자 송금" onBack={() => navigate('/transfer')} />

        <div className={styles.section}>최근 송금한 대상</div>

        <div className={styles.scrollRow}>
          {RECENT_USERS.map((user) => (
            <div
              key={user.name}
              className={styles.recentCard}
              onClick={() => handleRecentSelect(user)}
            >
              <div className={`${styles.avatar} ${user.avatarClass}`}>{user.initial}</div>
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
            <div className={`${styles.avatar} ${verified.avatarClass}`}>{verified.initial}</div>
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

      <BottomNav activeIndex={0} />
    </div>
  );
}
