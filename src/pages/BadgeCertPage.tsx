import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './BadgeCertPage.module.css';

const BADGE_TYPES = [
  { title: '단기간 체류자', meta: '한국 거주 단기간 체류자' },
  { title: '언어 능통자', meta: '중국어, 베트남어, 태국어, 영어' },
];

export default function BadgeCertPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="배지 인증" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>프로필을 작성하고 배지를 받으세요</div>
          <div className={styles.cardText}>
            단기간 활동 또는 특정 조건을 만족하면 커뮤니티에서 특별한 배지가 표시됩니다.
          </div>
        </div>

        <div className={styles.list}>
          {BADGE_TYPES.map((badge, i) => (
            <div
              key={badge.title}
              className={`${styles.item} ${selected === i ? styles.itemSelected : ''}`}
              onClick={() => setSelected(i)}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{badge.title}</div>
                <div className={styles.itemMeta}>{badge.meta}</div>
              </div>
              <div className={`${styles.radio} ${selected === i ? styles.radioChecked : ''}`} />
            </div>
          ))}
        </div>

        <div className={styles.preview}>
          <span className={styles.previewIcon}>🏅</span>
          <p className={styles.previewLabel}>배지를 촬영 / 업로드</p>
          <p className={styles.previewHint}>관련 증빙 서류를 업로드해주세요.</p>
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={selected === null}
          onClick={() => navigate('/mypage/badge/complete')}
        >
          인증 요청
        </button>
      </div>

      <BottomNav activeIndex={3} />
    </div>
  );
}
