import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './AdditionalCertPage.module.css';

const ID_TYPES = [
  { title: '외국인 등록증', meta: '한국 거주 외국인 사용자' },
  { title: '본국 신분증', meta: '중국, 베트남, 태국, 미국' },
];

export default function AdditionalCertPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="추가 인증" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>안전한 송금을 위한 인증</div>
          <div className={styles.cardText}>
            외국인 등록증 또는 본국 신분증으로 인증하면 프로필에 인증 배지가 표시됩니다.
          </div>
        </div>

        <div className={styles.list}>
          {ID_TYPES.map((idType, i) => (
            <div
              key={idType.title}
              className={`${styles.item} ${selected === i ? styles.itemSelected : ''}`}
              onClick={() => setSelected(i)}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{idType.title}</div>
                <div className={styles.itemMeta}>{idType.meta}</div>
              </div>
              <span className={`${styles.chevron} ${selected === i ? styles.chevronActive : ''}`}>
                ›
              </span>
            </div>
          ))}
        </div>

        <div className={styles.preview}>
          <p className={styles.previewLabel}>신분증 촬영 / 업로드</p>
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
    </>
  );
}
