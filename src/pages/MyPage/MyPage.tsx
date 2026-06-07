import { useNavigate } from 'react-router-dom';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyVerification } from '@/hooks/useMyVerification';
import styles from './MyPage.module.css';

const MY_ACTIVITY = [
  { label: '송금내역 조회', path: '/mypage/wallet-history' },
  { label: '환전 내역', path: '/mypage/exchange-history' },
  { label: '문서 분석 내역', path: '/mypage/doc-analysis-history' },
  { label: '정기 송금 내역', path: '/recurring' },
  { label: '계좌 관리', path: '/mypage/accounts' },
  { label: '구독 관리', path: '/mypage/subscription' },
];

export default function MyPage() {
  const navigate = useNavigate();
  // 내 프로필 — 닉네임/아바타에 사용. 로딩 중엔 placeholder, 실패는 일단 빈값으로 표시.
  // (사이클 1: 에러 분기 단순화 — 마이페이지 진입 자체가 인증 필요라 토큰 만료는 interceptor가 /login으로 redirect.)
  const { data: profile, isLoading } = useMyProfile();
  // 인증 상태 — 닉네임 옆 '인증' / 설정 '추가 인증' 옆 '완료' 배지의 SSOT.
  // 이력 없는 신규 회원은 null이라 자연스럽게 미표시. status === 'APPROVED'일 때만 인증 완료.
  const { data: verification } = useMyVerification();
  const isVerified = verification?.status === 'APPROVED';

  // 설정/관리 행은 인증 상태에 따라 배지가 바뀌므로 컴포넌트 안에서 구성한다.
  const SETTINGS: { label: string; badge: string | null; path: string }[] = [
    { label: '추가 인증', badge: isVerified ? '완료' : null, path: '/mypage/badge' },
    { label: '언어 설정', badge: null, path: '/mypage/language' },
  ];

  const nickname = profile?.nickname ?? '';
  const initial = nickname.charAt(0).toUpperCase() || '?';

  return (
    <>
      <div className={styles.noTopPad}>
        {/* Custom top bar */}
        <div className={styles.topBar}>
          <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
            ‹
          </button>
          <span className={styles.topTitle}>마이페이지</span>
          <div style={{ width: 40 }} />
        </div>

        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileRow}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                {isLoading ? '불러오는 중…' : nickname}
                {isVerified && <span className={styles.verifiedPill}>인증</span>}
              </div>
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
    </>
  );
}
