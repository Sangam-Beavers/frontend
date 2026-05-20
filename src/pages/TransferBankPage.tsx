import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './TransferBankPage.module.css';

const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'IBK기업은행',
  'NH농협은행',
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
];

const FEE = 500;

interface RecentAccount {
  bank: string;
  holder: string;
  masked: string;
  lastAmount: string;
}

const RECENT_ACCOUNTS: RecentAccount[] = [
  { bank: '국민은행', holder: '김민수', masked: '123-****-1111', lastAmount: '₩200,000' },
];

export default function TransferBankPage() {
  const navigate = useNavigate();
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [holderVerified, setHolderVerified] = useState(false);
  const [amount, setAmount] = useState('');

  const num = parseInt(amount.replace(/[^0-9]/g, '')) || 0;
  const total = num > 0 ? num + FEE : 0;

  function handleVerifyHolder() {
    if (accountNumber.length >= 8) setHolderVerified(true);
  }

  function handleSelectRecent(acc: RecentAccount) {
    setBank(acc.bank);
    setHolder(acc.holder);
    setHolderVerified(true);
  }

  const canSubmit = bank !== '' && accountNumber !== '' && holderVerified && num > 0;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="타행계좌 송금" onBack={() => navigate('/transfer')} />

        <div className={styles.section}>최근 송금 계좌</div>

        <div className={styles.list}>
          {RECENT_ACCOUNTS.map((acc) => (
            <div key={acc.masked} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>
                  {acc.bank} · {acc.holder}
                </div>
                <div className={styles.itemMeta}>
                  {acc.masked} · 최근 {acc.lastAmount}
                </div>
              </div>
              <span className={styles.pill} onClick={() => handleSelectRecent(acc)}>
                선택
              </span>
            </div>
          ))}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="bank-select">
            보낼 은행
          </label>
          <select
            id="bank-select"
            className={styles.select}
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          >
            <option value="">은행 선택 ▾</option>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="account-number">
            계좌번호
          </label>
          <input
            id="account-number"
            type="text"
            className={styles.input}
            placeholder="계좌번호 입력 (- 없이)"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              setHolderVerified(false);
              setHolder('');
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>예금주</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="계좌 확인 후 자동 입력"
              value={holderVerified ? holder : holder}
              readOnly={holderVerified}
              onChange={(e) => setHolder(e.target.value)}
            />
            {!holderVerified && (
              <button type="button" className={styles.inputAction} onClick={handleVerifyHolder}>
                확인
              </button>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            송금할 금액
          </label>
          <input
            id="transfer-amount"
            type="number"
            className={styles.input}
            placeholder="₩0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {num > 0 && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span>수수료</span>
              <b>₩{FEE.toLocaleString()}</b>
            </div>
            <div className={styles.row}>
              <span>최종 차감</span>
              <b>₩{total.toLocaleString()}</b>
            </div>
          </div>
        )}
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
