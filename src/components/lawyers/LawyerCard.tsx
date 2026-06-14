import { useState } from 'react';
import { LAWYER_CATEGORY_LABEL } from '@/types/lawyer';
import type { Lawyer } from '@/types/lawyer';
import styles from './LawyerCard.module.css';

interface LawyerCardProps {
  lawyer: Lawyer;
}

/** 변호사 광고 카드 — 아바타(상담가능 점) + 분야 뱃지 + 이름 + 해시태그 + 연락/지역/언어. */
export default function LawyerCard({ lawyer }: LawyerCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(lawyer.photoUrl) && !imgError;

  return (
    <article className={styles.card}>
      <div className={styles.row}>
        <div className={styles.avatarWrap}>
          {showImage ? (
            <img
              src={lawyer.photoUrl}
              alt={lawyer.name}
              className={styles.avatarImg}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={styles.avatarFallback}>{lawyer.name.charAt(0)}</span>
          )}
          {lawyer.online && <span className={styles.onlineDot} aria-label="상담 가능" />}
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={`${styles.badge} ${styles[`badge_${lawyer.category}`]}`}>
              {LAWYER_CATEGORY_LABEL[lawyer.category]}
            </span>
            <span className={styles.name}>{lawyer.name}</span>
            <span className={styles.suffix}>변호사</span>
          </div>

          <div className={styles.tags}>
            {lawyer.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className={styles.meta}>
            <span className={styles.metaItem}>📞 {lawyer.phone}</span>
            <span className={styles.divider} />
            <span className={styles.metaItem}>📍 {lawyer.location}</span>
            <span className={styles.divider} />
            <span className={styles.metaItem}>🌐 {lawyer.languages.join(' · ')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
