import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faqsApi, type FaqItem } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import styles from './CommunityFaqPage.module.css';

const CATEGORIES = [
  { key: '', labelKey: 'community.faq.categories.all' },
  { key: 'GENERAL', labelKey: 'community.faq.categories.GENERAL' },
  { key: 'TRANSFER', labelKey: 'community.faq.categories.TRANSFER' },
  { key: 'EXCHANGE', labelKey: 'community.faq.categories.EXCHANGE' },
  { key: 'DOCUMENT', labelKey: 'community.faq.categories.DOCUMENT' },
  { key: 'ACCOUNT', labelKey: 'community.faq.categories.ACCOUNT' },
];

export default function CommunityFaqPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const {
    data: faqs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['faqs', category],
    queryFn: () => faqsApi.listPublished(category || undefined),
  });

  return (
    <div className={styles.wrap}>
      <TopBar
        title={t('community.faq.title')}
        onBack={() => navigate(location.state?.from ?? ROUTES.COMMUNITY)}
      />

      <div className={styles.tabs}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={category === c.key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => {
              setCategory(c.key);
              setOpenId(null);
            }}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.empty}>{t('community.faq.loading')}</div>
      ) : isError ? (
        <div className={styles.empty} role="alert">
          {t('community.faq.loadError')}
        </div>
      ) : faqs.length === 0 ? (
        <div className={styles.empty}>{t('community.faq.empty')}</div>
      ) : (
        <div className={styles.list}>
          {faqs.map((f: FaqItem) => (
            <div key={f.publicId} className={styles.item}>
              <button
                type="button"
                className={styles.question}
                onClick={() => setOpenId(openId === f.publicId ? null : f.publicId)}
              >
                <span className={styles.qMark}>Q</span>
                <span className={styles.qText}>{f.question}</span>
                <span className={styles.chevron}>{openId === f.publicId ? '▲' : '▼'}</span>
              </button>
              {openId === f.publicId && (
                <div className={styles.answer}>
                  <span className={styles.aMark}>A</span>
                  <span className={styles.aText}>{f.answer}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
