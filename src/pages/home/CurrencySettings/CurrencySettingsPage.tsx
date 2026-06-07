import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <TopBar title={t('currencySettings.title')} onBack={() => navigate(-1)} />

        <p className={styles.desc}>{t('currencySettings.description')}</p>

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
                  <div className={styles.itemLabel}>
                    {t(`home.currencies.${cur.code}`, { defaultValue: cur.label })}
                  </div>
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
          {t('currencySettings.save', { selected: selected.length, max: MAX_SELECT })}
        </button>
      </div>
    </>
  );
}
