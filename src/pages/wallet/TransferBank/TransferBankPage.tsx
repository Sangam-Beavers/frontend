import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useRecentRemittanceAccounts } from '@/hooks/useRecentRemittanceAccounts';
import type { AccountItem, RecentRemittanceAccountItem } from '@/api/wallet';
import styles from './TransferBankPage.module.css';

// 사용자가 선택한 계좌 — 출처에 따라 라벨/정보가 다르다.
// 'my'   : 본인이 등록한 계좌 (등록된 내 계좌 섹션). 송금 시 recipientName='내 계좌'.
// 'recent': 과거 송금했던 타인 계좌 (최근 송금한 계좌 섹션). 송금 시 recipientName=수취인명.
type Picked =
  | { kind: 'my'; account: AccountItem }
  | { kind: 'recent'; account: RecentRemittanceAccountItem };

// 최근 송금 계좌 한 줄에 고유 key — bank_code + 마스킹 계좌번호 조합. 응답에 id가 없어 합성.
function recentKey(acc: RecentRemittanceAccountItem): string {
  return `${acc.bank_code}::${acc.account_number}`;
}

export default function TransferBankPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  const {
    data: recentData,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentRemittanceAccounts();
  // 지갑 없음(WALLET4001)이면 섹션 자체를 숨긴다 — 신규/미생성 사용자가 자연스럽게.
  // 그 외 에러는 카드 안에 메시지 + 재시도 노출(#120 패턴).
  const recentHidden = recentError instanceof ApiException && recentError.code === 'WALLET4001';
  const recentAccounts = recentData?.accounts ?? [];

  // 사용자가 직접 고르기 전엔 주 계좌를 기본 선택(없으면 첫 계좌). 백엔드가 주 계좌 우선 정렬.
  const [picked, setPicked] = useState<Picked | null>(null);
  const defaultMy = accounts.find((a) => a.is_primary) ?? accounts[0] ?? null;
  const selected: Picked | null = picked ?? (defaultMy ? { kind: 'my', account: defaultMy } : null);

  const [amount, setAmount] = useState('');
  const num = Number(amount) || 0;
  const canSubmit = selected !== null && num > 0;

  function buildConfirmState() {
    if (!selected) return null;
    if (selected.kind === 'my') {
      const a = selected.account;
      return {
        recipientName: t('transfer.bank.myAccount'),
        recipientInitial: a.bank_name?.[0] ?? '',
        recipientMeta: `${a.bank_name} ${a.account_number_masked}`,
        recipientKind: 'account' as const,
        currency: 'KRW',
        amount: num.toLocaleString(),
      };
    }
    const a = selected.account;
    return {
      recipientName: a.account_holder,
      recipientInitial: a.account_holder?.[0] ?? '',
      recipientMeta: `${a.bank_name} ${a.account_number}`,
      recipientKind: 'account' as const,
      currency: a.currency_code, // 최근 송금 시점의 통화 — v1은 라벨 용도, 입력은 숫자만
      amount: num.toLocaleString(),
    };
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('transfer.bank.title')} onBack={() => navigate('/transfer')} />

        {/* ─── 최근 송금한 계좌 (신규 #140) ─── */}
        {!recentHidden && (
          <>
            <div className={styles.section}>{t('transfer.bank.recentSection')}</div>
            <div className={styles.list}>
              {recentLoading && (
                <div className={styles.item}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemMeta}>{t('transfer.bank.loading')}</div>
                  </div>
                </div>
              )}
              {!recentLoading && recentError && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyText}>{t('transfer.bank.recentLoadError')}</div>
                  <button
                    type="button"
                    className={styles.registerBtn}
                    onClick={() => refetchRecent()}
                  >
                    {t('transfer.bank.retry')}
                  </button>
                </div>
              )}
              {!recentLoading && !recentError && recentAccounts.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyText}>{t('transfer.bank.recentEmpty')}</div>
                </div>
              )}
              {!recentLoading &&
                !recentError &&
                recentAccounts.map((acc) => {
                  const isSelected =
                    selected?.kind === 'recent' && recentKey(selected.account) === recentKey(acc);
                  return (
                    <div
                      key={recentKey(acc)}
                      className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                      onClick={() => setPicked({ kind: 'recent', account: acc })}
                    >
                      <div className={styles.itemMain}>
                        <div className={styles.itemTitle}>
                          {acc.account_holder} · {acc.bank_name}
                        </div>
                        <div className={styles.itemMeta}>
                          {acc.account_number} · {acc.currency_code}
                        </div>
                      </div>
                      {isSelected && <span className={styles.checkMark}>✓</span>}
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ─── 등록된 내 계좌 (기존 흐름) ─── */}
        <div className={styles.section}>{t('transfer.bank.mySection')}</div>

        <div className={styles.list}>
          {isLoading && (
            <div className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemMeta}>{t('transfer.bank.accountsLoading')}</div>
              </div>
            </div>
          )}
          {error && (
            <div className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemMeta}>{t('transfer.bank.accountsLoadError')}</div>
              </div>
            </div>
          )}
          {!isLoading && !error && accounts.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyText}>{t('transfer.bank.myEmpty')}</div>
              <button
                type="button"
                className={styles.registerBtn}
                onClick={() => navigate('/charge/add-account')}
              >
                {t('transfer.bank.registerAccount')}
              </button>
            </div>
          )}
          {accounts.map((acc) => {
            const isSelected =
              selected?.kind === 'my' &&
              selected.account.account_public_id === acc.account_public_id;
            return (
              <div
                key={acc.account_public_id}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => setPicked({ kind: 'my', account: acc })}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{acc.bank_name}</div>
                  <div className={styles.itemMeta}>
                    {acc.account_number_masked}
                    {acc.is_primary ? ` · ${t('transfer.bank.primaryBadge')}` : ''}
                  </div>
                </div>
                {isSelected && <span className={styles.checkMark}>✓</span>}
              </div>
            );
          })}
          {accounts.length > 0 && (
            <button
              type="button"
              className={styles.addItem}
              onClick={() => navigate('/charge/add-account')}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{t('transfer.bank.addAccount')}</div>
                <div className={styles.itemMeta}>{t('transfer.bank.addAccountDesc')}</div>
              </div>
              <span className={styles.addIcon}>＋</span>
            </button>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            {t('transfer.bank.amountLabel')}
          </label>
          <input
            id="transfer-amount"
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            disabled={selected === null}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() => {
            const state = buildConfirmState();
            if (!state) return;
            navigate('/transfer/confirm', { state });
          }}
        >
          {t('transfer.bank.next')}
        </button>
      </div>
    </>
  );
}
