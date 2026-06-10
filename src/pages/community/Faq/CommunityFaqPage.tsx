import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faqsApi, type FaqItem } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import styles from './CommunityFaqPage.module.css';

const CATEGORIES = [
  { key: '', label: '전체' },
  { key: 'GENERAL', label: '일반' },
  { key: 'TRANSFER', label: '송금' },
  { key: 'EXCHANGE', label: '환전' },
  { key: 'DOCUMENT', label: '서류 분석' },
  { key: 'ACCOUNT', label: '계정' },
];

export default function CommunityFaqPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs', category],
    queryFn: () => faqsApi.listPublished(category || undefined),
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>자주 묻는 질문</span>
        <div style={{ width: 40 }} />
      </div>

      {/* 카테고리 탭 */}
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
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : faqs.length === 0 ? (
        <div className={styles.empty}>등록된 FAQ가 없습니다.</div>
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
