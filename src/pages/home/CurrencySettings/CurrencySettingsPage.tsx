import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { SUPPORTED_CURRENCIES } from '@/constants/currencies';
import styles from './CurrencySettingsPage.module.css';

const STORAGE_KEY = 'homeCurrencies';
const MAX_SELECT = 2;

export default function CurrencySettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 표시 통화 후보 = 외화 3종(VND/PHP/USD). KRW는 항상 디폴트로 풀에 포함되므로 선택 대상이 아니다.
  // 메인 통화는 홈에서 'KRW + 선택 외화' 중 하나로 고른다.
  const candidates = SUPPORTED_CURRENCIES.filter((code) => code !== 'KRW');

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
        <button type="button" className={styles.primaryBtn} onClick={save}>
          {t('currencySettings.save', { selected: selected.length, max: MAX_SELECT })}
        </button>
      </div>
    </>
  );
}
