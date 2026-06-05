import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import type { AccountItem } from '@/api/wallet';
import styles from './TransferBankPage.module.css';

export default function TransferBankPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [amount, setAmount] = useState('');

  const num = Number(amount) || 0;
  const canSubmit = selectedAccount !== null && num > 0;

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="내 계좌로 보내기" onBack={() => navigate('/transfer')} />

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
          {!isLoading && !error && accounts.length === 0 && (
            <div className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemMeta}>등록된 계좌가 없습니다.</div>
              </div>
            </div>
          )}
          {accounts.map((acc) => {
            const isSelected = selectedAccount?.account_public_id === acc.account_public_id;
            return (
              <div
                key={acc.account_public_id}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => setSelectedAccount(acc)}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{acc.bank_name}</div>
                  <div className={styles.itemMeta}>
                    {acc.account_number_masked}
                    {acc.is_primary ? ' · 주 계좌' : ''}
                  </div>
                </div>
                {isSelected && <span className={styles.checkMark}>✓</span>}
              </div>
            );
          })}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            송금할 금액
          </label>
          <input
            id="transfer-amount"
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            disabled={selectedAccount === null}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() =>
            navigate('/transfer/confirm', {
              state: {
                recipientName: selectedAccount?.bank_name,
                recipientInitial: selectedAccount?.bank_name?.[0] ?? '',
                currency: 'KRW',
                amount: num.toLocaleString(),
                memo: selectedAccount?.account_number_masked ?? '',
              },
            })
          }
        >
          다음
        </button>
      </div>
    </>
  );
}
