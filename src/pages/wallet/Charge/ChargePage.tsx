import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { CHARGE_ACCOUNTS_MOCK } from '@/mocks/chargeMock';
import { HOME_WALLET_BALANCE_MOCK } from '@/mocks/homeMock';
import styles from './ChargePage.module.css';

const ACCOUNTS = CHARGE_ACCOUNTS_MOCK.result;
const WALLET_BALANCE = HOME_WALLET_BALANCE_MOCK.result;
const CHARGE_AMOUNT = 300_000;

const formatKRW = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

/**
 * 전자지갑 충전 화면.
 *
 * <p>이슈 #108: 인증 후 지갑은 만들어졌지만 연동 계좌가 0건이면 충전 자체가 불가능하므로
 * <b>"계좌를 연동해주세요"</b> 빈 상태 UI를 우선 노출하고 계좌 추가 CTA로 유도한다. 계좌가 있으면
 * 기존 충전 흐름 그대로.
 *
 * <p>현재 ACCOUNTS는 mock — 실 API 연동(`walletApi.getMyAccounts` 추후 추가) 시점에는 useQuery로
 * 교체. 빈 상태 UI 패턴은 그대로 유지.
 */
export default function ChargePage() {
  const navigate = useNavigate();
  const hasAccounts = ACCOUNTS.length > 0;

  // 빈 계좌 케이스에서 ACCOUNTS[0] 접근으로 런타임 오류가 나지 않도록 옵셔널 chaining + fallback.
  const [selectedAccountId, setSelectedAccountId] = useState<string>(ACCOUNTS[0]?.id ?? '');
  const [chargeAmount, setChargeAmount] = useState<number>(CHARGE_AMOUNT);

  const afterBalance = WALLET_BALANCE + chargeAmount;

  // 계좌 0건 — 빈 상태 안내 우선 노출(이슈 #108). 충전 흐름 자체를 막아 잘못된 선택을 차단.
  if (!hasAccounts) {
    return (
      <>
        <TopBar title="가져오기" />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>현재 전자지갑 잔액</div>
          <div className={styles.cardBalance}>{formatKRW(WALLET_BALANCE)}</div>
        </div>

        <div className={`${styles.card}`}>
          <div className={styles.cardTitle}>계좌를 연동해주세요</div>
          <div className={styles.cardText}>
            전자지갑은 개설되었지만 아직 연동된 계좌가 없습니다. 계좌를 연동하면 전자지갑을 충전할
            수 있어요.
          </div>
        </div>

        <div className={styles.primaryFixed}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
          >
            계좌 연동하기
          </button>
        </div>
      </>
    );
  }

  return (
    <>
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
          onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
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
