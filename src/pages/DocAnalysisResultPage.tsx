import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './DocAnalysisResultPage.module.css';

const ISSUES = [
  { title: '임금 분석', meta: '최저임금보다 낮을 가능성' },
  { title: '근로시간', meta: '초과근무 관련 확인 필요' },
];

export default function DocAnalysisResultPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="분석 결과" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>중요 안내</div>
          <div className={styles.cardText}>
            AI 분석 결과는 참고용이며 일부만을 위한 게 아닐 수 있습니다. 중요한 판단이나 자세한
            상담은 반드시 전문가와 함께하세요.
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardPurple}`}>
          <div className={styles.cardTitle}>전문가 상담</div>
          <div className={styles.cardText}>노동/체류 관련 전문가 무료 상담 제공</div>
          <button type="button" className={styles.secondaryBtn}>
            바로 알아보기
          </button>
        </div>

        <div className={`${styles.card} ${styles.cardDanger}`}>
          <div className={styles.cardTitle}>최종 판단: 검토 필요</div>
          <div className={styles.cardText}>임금과 근로시간 적절성을 확인하세요.</div>
        </div>

        <div className={styles.list}>
          {ISSUES.map((item, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>{item.meta}</div>
              </div>
              <span className={styles.pillWarn}>경고</span>
            </div>
          ))}
        </div>

        <div className={styles.btnRow}>
          <button type="button" className={styles.secondaryBtn}>
            저장 내보내기
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/community')}
          >
            커뮤니티 공유
          </button>
        </div>
      </div>

      <BottomNav activeIndex={1} />
    </div>
  );
}
