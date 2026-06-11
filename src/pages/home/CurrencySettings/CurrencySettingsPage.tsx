import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/constants/currencies';
import styles from './CurrencySettingsPage.module.css';

const STORAGE_KEY = 'homeCurrencies';
const MAIN_CURRENCY_KEY = 'homeMainCurrency';
const MAX_SELECT = 2;

/** 메인 통화(이슈 #194) — 표시 통화 후보에서 제외 대상. */
function loadMainCurrency(): string {
  try {
    const raw = localStorage.getItem(MAIN_CURRENCY_KEY);
    return raw && isSupportedCurrency(raw) ? raw : 'KRW';
  } catch {
    return 'KRW';
  }
}

export default function CurrencySettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 표시 통화 후보 = 지원 통화 4개 − 메인 통화 1개 = 3개(이슈 #194).
  const mainCurrency = loadMainCurrency();
  const candidates = SUPPORTED_CURRENCIES.filter((code) => code !== mainCurrency);

  // 저장값 정제: 후보(지원 통화 ∧ ≠메인)에 없는 코드는 제거.
  function loadSaved(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const codes: string[] = raw ? (JSON.parse(raw) as string[]) : ['USD', 'VND'];
      return codes.filter((code) => (candidates as readonly string[]).includes(code));
    } catch {
      return candidates.filter((c) => c === 'USD' || c === 'VND');
    }
  }

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
          {candidates.map((code) => {
            const checked = selected.includes(code);
            const disabled = !checked && selected.length >= MAX_SELECT;
            return (
              <div
                key={code}
                className={`${styles.item} ${disabled ? styles.itemDisabled : ''}`}
                onClick={() => !disabled && toggle(code)}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.itemCode}>{code}</div>
                  <div className={styles.itemLabel}>{t(`home.currencies.${code}`)}</div>
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
