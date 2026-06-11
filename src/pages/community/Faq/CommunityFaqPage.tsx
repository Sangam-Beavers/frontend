import { useLayoutEffect, useRef, useState } from 'react';
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

  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const list = tabsRef.current;
    const tab = activeTabRef.current;
    if (!list || !tab) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const delta = tabRect.left - listRect.left - (list.clientWidth - tabRect.width) / 2;
    list.scrollLeft += delta;
  }, [category]);

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
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.COMMUNITY))}
      />

      <div className={styles.banner}>
        <b>{t('community.faq.title')}</b>
        <span>{t('community.faq.bannerSub')}</span>
      </div>

      <div className={styles.tabs} ref={tabsRef}>
        {CATEGORIES.map((c) => {
          const isActive = category === c.key;
          return (
            <button
              key={c.key}
              ref={isActive ? activeTabRef : undefined}
              type="button"
              className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => {
                setCategory(c.key);
                setOpenId(null);
              }}
            >
              {t(c.labelKey)}
            </button>
          );
        })}
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
          {faqs.map((f: FaqItem) => {
            const isOpen = openId === f.publicId;
            return (
              <div key={f.publicId} className={styles.item}>
                <button
                  type="button"
                  className={`${styles.question} ${isOpen ? styles.questionOpen : ''}`}
                  onClick={() => setOpenId(isOpen ? null : f.publicId)}
                >
                  <span className={styles.qMark}>Q</span>
                  <span className={styles.qText}>{f.question}</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
                </button>
                <div className={`${styles.answerWrap} ${isOpen ? styles.answerWrapOpen : ''}`}>
                  <div className={styles.answer}>
                    <span className={styles.aMark}>A</span>
                    <span className={styles.aText}>{f.answer}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
