import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import styles from './MyPage.module.css';

const MY_ACTIVITY = [
  { label: '송금내역 조회', path: '/mypage/transfer-history' },
  { label: '환전 내역', path: '/mypage/exchange-history' },
  { label: '문서 분석 내역', path: '/mypage/doc-history' },
  { label: '정기 송금 내역', path: '/recurring' },
];

const SETTINGS = [
  { label: '보안 설정', badge: '완료' as const, path: '/mypage/security' },
  { label: '알림 설정', badge: null, path: '/mypage/notifications' },
  { label: '언어 설정', badge: null, path: '/mypage/language' },
];

export default function MyPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Custom top bar */}
        <div className={styles.topBar}>
          <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
            ‹
          </button>
          <span className={styles.topTitle}>마이페이지</span>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => navigate('/mypage/settings')}
          >
            ⚙️
          </button>
        </div>

        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileRow}>
            <div className={styles.avatar}>G</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                global_neighbor
                <span className={styles.pill}>프리미엄</span>
              </div>
              <div className={styles.profileBio}>베트남어 및 친구들과 이용 중인데 매우 만족</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/mypage/profile')}
          >
            프로필 편집
          </button>
        </div>

        <div className={styles.section}>나의 활동</div>

        <div className={styles.list}>
          {MY_ACTIVITY.map((item) => (
            <div key={item.label} className={styles.item} onClick={() => navigate(item.path)}>
              <div className={styles.itemTitle}>{item.label}</div>
              <span className={styles.arrow}>›</span>
            </div>
          ))}
        </div>

        <div className={styles.section}>설정 / 관리</div>

        <div className={styles.list}>
          {SETTINGS.map((item) => (
            <div key={item.label} className={styles.item} onClick={() => navigate(item.path)}>
              <div className={styles.itemTitle}>{item.label}</div>
              {item.badge ? (
                <span className={styles.pill}>{item.badge}</span>
              ) : (
                <span className={styles.arrow}>›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeIndex={3} />
    </div>
  );
}
