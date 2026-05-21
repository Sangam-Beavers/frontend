import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { SETTING_LANGUAGES } from '@/constants/languages';
import styles from './LanguageSettingsPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;

export default function LanguageSettingsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('한국어');

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="언어 설정" onBack={() => navigate(-1)} />

        <div className={styles.list}>
          {LANGUAGES.map((lang) => (
            <div
              key={lang}
              className={`${styles.item} ${selected === lang ? styles.itemSelected : ''}`}
              onClick={() => setSelected(lang)}
            >
              <span className={styles.itemLabel}>{lang}</span>
              {selected === lang ? (
                <span className={styles.pill}>현재</span>
              ) : (
                <div className={styles.radio} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate(-1)}>
          저장
        </button>
      </div>
    </>
  );
}
