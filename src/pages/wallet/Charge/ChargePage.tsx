import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { HOME_WALLET_BALANCE_MOCK } from '@/mocks/homeMock';
import styles from './ChargePage.module.css';

const WALLET_BALANCE = HOME_WALLET_BALANCE_MOCK.result;
const CHARGE_AMOUNT = 300_000;

const formatKRW = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

export default function ChargePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  // 기본 선택: 사용자가 고르기 전엔 첫 계좌(백엔드가 주 계좌 우선으로 정렬해 내려줌).
  const [picked, setPicked] = useState<string | null>(null);
  const selectedAccountId = picked ?? accounts[0]?.account_public_id ?? null;

  const [chargeAmount, setChargeAmount] = useState<number>(CHARGE_AMOUNT);
  const afterBalance = WALLET_BALANCE + chargeAmount;

  return (
    <>
      <TopBar title="가져오기" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>현재 전자지갑 잔액</div>
        <div className={styles.cardBalance}>{formatKRW(WALLET_BALANCE)}</div>
      </div>

      <div className={styles.section}>등록된 내 계좌</div>
      <div className={styles.list}>
        {isLoading && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>계좌를 불러오는 중…</div>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>계좌를 불러오지 못했어요.</div>
            </div>
          </div>
        )}
        {accounts.map((account) => (
          <button
            key={account.account_public_id}
            type="button"
            className={styles.item}
            onClick={() => setPicked(account.account_public_id)}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{account.bank_name}</div>
              <div className={styles.itemMeta}>
                {account.account_number_masked}
                {account.is_primary ? ' · 주 계좌' : ''}
              </div>
            </div>
            {selectedAccountId === account.account_public_id && (
              <span className={styles.pill}>선택</span>
            )}
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
        <label htmlFor="charge-amount">충전할 금액 (₩)</label>
        <input
          id="charge-amount"
          type="number"
          min={0}
          step={1000}
          className={styles.input}
          value={chargeAmount}
          onChange={(e) => setChargeAmount(Math.max(0, Number(e.target.value)))}
        />
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
    </>
  );
}
