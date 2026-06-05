import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useBalances, balanceOf } from '@/hooks/useBalances';
import { useChargeAccount } from '@/hooks/useChargeAccount';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import styles from './ChargePage.module.css';

const formatKRW = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

/**
 * 전자지갑 충전 화면.
 *
 * <p>실 API 연동(#102): {@link useMyAccounts}로 계좌 목록, {@link useBalances}로 KRW 잔액,
 * {@link useChargeAccount}로 충전 실행. 이슈 #108 — 인증 후 지갑은 만들어졌지만 연동 계좌가
 * 0건이면 충전 자체가 불가능하므로 <b>"계좌를 연동해주세요"</b> 빈 상태 UI를 우선 노출하고
 * 계좌 추가 CTA로 유도한다(잘못된 선택 차단).
 */
export default function ChargePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];
  const hasAccounts = accounts.length > 0;

  // 기본 선택: 사용자가 고르기 전엔 주 계좌(없으면 첫 계좌). 백엔드가 주 계좌 우선 정렬.
  const [picked, setPicked] = useState<string | null>(null);
  const selectedAccountId =
    picked ??
    accounts.find((a) => a.is_primary)?.account_public_id ??
    accounts[0]?.account_public_id ??
    null;

  // 실제 KRW 잔액 — useBalances는 string("1530000.0000") 반환 → Number 변환.
  // 지갑 없음(WALLET4001)이면 0으로 fallback (가입 직후 등 일시 상태).
  // 충전 성공 시 useChargeAccount가 ['wallet','balances']를 invalidate → 자동 갱신.
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  const hasWalletError =
    balancesError instanceof ApiException && balancesError.code === 'WALLET4001';
  const walletBalance = hasWalletError ? 0 : Number(balanceOf(balances, 'KRW'));

  const [chargeAmount, setChargeAmount] = useState<number>(0);
  const afterBalance = walletBalance + chargeAmount;

  const charge = useChargeAccount();
  const canCharge = selectedAccountId !== null && chargeAmount > 0 && !charge.isPending;

  // 멱등키: (계좌, 금액)이 같으면 같은 키 재사용(네트워크 재시도 시 중복 충전 방지),
  // 바뀌면 새 키. 성공하면 비워서 다음 충전은 새 거래로 처리한다.
  const lastCharge = useRef<{ key: string; account: string; amount: number } | null>(null);

  const handleCharge = () => {
    if (!selectedAccountId || chargeAmount <= 0 || charge.isPending) return;
    const prev = lastCharge.current;
    // 같은 (계좌, 금액) 재시도면 같은 키 재사용(멱등), 바뀌면 새 키.
    const entry =
      prev && prev.account === selectedAccountId && prev.amount === chargeAmount
        ? prev
        : { key: crypto.randomUUID(), account: selectedAccountId, amount: chargeAmount };
    lastCharge.current = entry;
    charge.mutate(
      {
        accountId: selectedAccountId,
        amount: String(chargeAmount),
        idempotencyKey: entry.key,
      },
      {
        onSuccess: () => {
          lastCharge.current = null;
          navigate('/mypage/wallet-history');
        },
      }
    );
  };

  // 계좌 0건 — 빈 상태 안내 우선 노출(이슈 #108). 충전 흐름 자체를 막아 잘못된 선택을 차단.
  // 로딩/에러 중에는 빈 상태로 단정하지 않는다(false negative 방지).
  if (!isLoading && !error && !hasAccounts) {
    return (
      <>
        <TopBar title="가져오기" />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>현재 전자지갑 잔액</div>
          <div className={styles.cardBalance}>
            {balancesLoading ? '—' : formatKRW(walletBalance)}
          </div>
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
        <div className={styles.cardBalance}>{balancesLoading ? '—' : formatKRW(walletBalance)}</div>
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
          placeholder="충전할 금액을 입력하세요"
          value={chargeAmount || ''}
          onChange={(e) => setChargeAmount(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>충전 후 전자지갑</span>
          <b>{balancesLoading ? '—' : formatKRW(afterBalance)}</b>
        </div>
      </div>

      {charge.error && <div className={styles.errorText}>{accountErrorMessage(charge.error)}</div>}

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canCharge}
          onClick={handleCharge}
        >
          {charge.isPending ? '충전 중…' : '충전하기'}
        </button>
      </div>
    </>
  );
}
