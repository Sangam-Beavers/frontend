import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { MY_ACCOUNTS_MOCK, type MyAccount } from '@/mocks/transferMock';
import styles from './TransferBankPage.module.css';

const MY_ACCOUNTS = MY_ACCOUNTS_MOCK.result;

export default function TransferBankPage() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<MyAccount | null>(null);
  const [amount, setAmount] = useState('');

  const num = Number(amount) || 0;
  const canSubmit = selectedAccount !== null && num > 0;

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="내 계좌로 보내기" onBack={() => navigate('/transfer')} />

        <div className={styles.section}>등록된 내 계좌</div>

        <div className={styles.list}>
          {MY_ACCOUNTS.map((acc) => {
            const isSelected = selectedAccount?.id === acc.id;
            return (
              <div
                key={acc.id}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => setSelectedAccount(acc)}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{acc.bank}</div>
                  <div className={styles.itemMeta}>
                    {acc.nickname} · {acc.masked}
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
                recipientName: selectedAccount?.bank,
                recipientInitial: selectedAccount?.bank?.[0] ?? '',
                currency: 'KRW',
                amount: num.toLocaleString(),
                memo: selectedAccount?.masked ?? '',
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
