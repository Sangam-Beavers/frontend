import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useBalances, balanceOf } from '@/hooks/useBalances';
import { useChargeAccount } from '@/hooks/useChargeAccount';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import styles from './ChargePage.module.css';

const formatKRW = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`;

export default function ChargePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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

  if (!isLoading && !error && !hasAccounts) {
    return (
      <>
        <TopBar
          title={t('charge.main.title')}
          onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.HOME))}
        />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>{t('charge.main.currentBalance')}</div>
          <div className={styles.cardBalance}>
            {balancesLoading ? '—' : formatKRW(walletBalance)}
          </div>
        </div>

        <div className={`${styles.card}`}>
          <div className={styles.cardTitle}>{t('charge.main.linkAccountTitle')}</div>
          <div className={styles.cardText}>{t('charge.main.linkAccountText')}</div>
        </div>

        <div className={styles.primaryFixed}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
          >
            {t('charge.main.linkAccountCta')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={t('charge.main.title')}
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.HOME))}
      />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>{t('charge.main.currentBalance')}</div>
        <div className={styles.cardBalance}>{balancesLoading ? '—' : formatKRW(walletBalance)}</div>
      </div>

      <div className={styles.section}>{t('charge.main.myAccounts')}</div>
      <div className={styles.list}>
        {isLoading && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('charge.main.accountsLoading')}</div>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('charge.main.accountsError')}</div>
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
                {account.is_primary ? ` · ${t('charge.main.primaryAccount')}` : ''}
              </div>
            </div>
            {selectedAccountId === account.account_public_id && (
              <span className={styles.pill}>{t('charge.main.selected')}</span>
            )}
          </button>
        ))}
        <button
          type="button"
          className={styles.item}
          onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
        >
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>{t('charge.main.addAccount')}</div>
            <div className={styles.itemMeta}>{t('charge.main.addAccountMeta')}</div>
          </div>
          <div className={styles.iconBtn}>＋</div>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="charge-amount">{t('charge.main.amountLabel')}</label>
        <input
          id="charge-amount"
          type="number"
          min={0}
          step={1000}
          className={styles.input}
          placeholder={t('charge.main.amountPlaceholder')}
          value={chargeAmount || ''}
          onChange={(e) => setChargeAmount(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>{t('charge.main.afterCharge')}</span>
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
          {charge.isPending ? t('charge.main.charging') : t('charge.main.chargeCta')}
        </button>
      </div>
    </>
  );
}
