import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { BankAccount } from '@/types/charge';
import styles from './ChargePage.module.css';

const ACCOUNTS: BankAccount[] = [
  { id: 'kb', bankName: '국민은행', maskedNumber: '123-****-7890', isPrimary: true },
];

const WALLET_BALANCE = 1_250_000;
const CHARGE_AMOUNT = 300_000;

const formatKRW = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

export default function ChargePage() {
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(ACCOUNTS[0].id);
  const [chargeAmount] = useState<number>(CHARGE_AMOUNT);

  const afterBalance = WALLET_BALANCE + chargeAmount;

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={0} />}>
      <TopBar title="가져오기" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>현재 전자지갑 잔액</div>
        <div className={styles.cardBalance}>{formatKRW(WALLET_BALANCE)}</div>
      </div>

      <div className={styles.section}>등록된 내 계좌</div>
      <div className={styles.list}>
        {ACCOUNTS.map((account) => (
          <button
            key={account.id}
            type="button"
            className={styles.item}
            onClick={() => setSelectedAccountId(account.id)}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{account.bankName}</div>
              <div className={styles.itemMeta}>
                {account.maskedNumber}
                {account.isPrimary ? ' · 주 계좌' : ''}
              </div>
            </div>
            {selectedAccountId === account.id && <span className={styles.pill}>선택</span>}
          </button>
        ))}
        <button
          type="button"
          className={styles.item}
          onClick={() => navigate('/charge/add-account')}
        >
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>계좌 추가</div>
            <div className={styles.itemMeta}>충전 계좌를 새로 등록합니다</div>
          </div>
          <div className={styles.iconBtn}>＋</div>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="charge-amount">충전할 금액</label>
        <div id="charge-amount" className={styles.input}>
          {formatKRW(chargeAmount)}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>충전 후 전자지갑</span>
          <b>{formatKRW(afterBalance)}</b>
        </div>
      </div>

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/mypage/wallet-history')}
        >
          충전하기
        </button>
      </div>
    </MobileScreen>
  );
}
