import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { HOME_ALL_CURRENCIES_MOCK } from '@/mocks/homeMock';
import styles from './CurrencySettingsPage.module.css';

const STORAGE_KEY = 'homeCurrencies';
const MAX_SELECT = 2;

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ['USD', 'VND'];
  } catch {
    return ['USD', 'VND'];
  }
}

export default function CurrencySettingsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(loadSaved);

  const toggle = (code: string) => {
    setSelected((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, code];
    });
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    navigate(-1);
  };

  return (
    <>
      <div className={styles.content}>
        <TopBar title="표시 통화 설정" onBack={() => navigate(-1)} />

        <p className={styles.desc}>홈 화면에 표시할 통화를 최대 2개 선택하세요.</p>

        <div className={styles.list}>
          {HOME_ALL_CURRENCIES_MOCK.map((cur) => {
            const checked = selected.includes(cur.code);
            const disabled = !checked && selected.length >= MAX_SELECT;
            return (
              <div
                key={cur.code}
                className={`${styles.item} ${disabled ? styles.itemDisabled : ''}`}
                onClick={() => !disabled && toggle(cur.code)}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.itemCode}>{cur.code}</div>
                  <div className={styles.itemLabel}>{cur.label}</div>
                </div>
                <div className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                  {checked && '✓'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={selected.length === 0}
          onClick={save}
        >
          저장 ({selected.length}/{MAX_SELECT})
        </button>
      </div>
    </>
  );
}
