import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyVerification } from '@/hooks/useMyVerification';
import styles from './MyPage.module.css';

export default function MyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // 내 프로필 — 닉네임/아바타에 사용. 로딩 중엔 placeholder, 실패는 일단 빈값으로 표시.
  // (사이클 1: 에러 분기 단순화 — 마이페이지 진입 자체가 인증 필요라 토큰 만료는 interceptor가 /login으로 redirect.)
  const { data: profile, isLoading } = useMyProfile();
  // 인증 상태 — 닉네임 옆 '인증' / 설정 '추가 인증' 옆 '완료' 배지의 SSOT.
  // 이력 없는 신규 회원은 null이라 자연스럽게 미표시. status === 'APPROVED'일 때만 인증 완료.
  const { data: verification } = useMyVerification();
  const isVerified = verification?.status === 'APPROVED';

  // 라벨이 언어 변경마다 재계산되도록 컴포넌트 안에서 구성한다.
  const MY_ACTIVITY = [
    { label: t('mypage.items.walletHistory'), path: '/mypage/wallet-history' },
    { label: t('mypage.items.exchangeHistory'), path: '/mypage/exchange-history' },
    { label: t('mypage.items.docAnalysisHistory'), path: '/mypage/doc-analysis-history' },
    { label: t('mypage.items.recurring'), path: '/recurring' },
    { label: t('mypage.items.accounts'), path: '/mypage/accounts' },
    { label: t('mypage.items.subscription'), path: '/mypage/subscription' },
  ];

  // 설정/관리 행은 인증 상태에 따라 배지가 바뀌므로 컴포넌트 안에서 구성한다.
  // 회원 탈퇴(이슈 #148)는 마지막에 둠 — 위험 동작은 의도적으로 뒤로.
  const SETTINGS: { label: string; badge: string | null; path: string }[] = [
    {
      label: t('mypage.items.additionalCert'),
      badge: isVerified ? t('mypage.verified') : null,
      path: '/mypage/badge',
    },
    { label: t('mypage.items.language'), badge: null, path: '/mypage/language' },
    { label: t('mypage.items.withdraw'), badge: null, path: '/mypage/withdraw' },
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
          <span className={styles.topTitle}>{t('mypage.title')}</span>
          <div style={{ width: 40 }} />
        </div>

        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileRow}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                {isLoading ? t('mypage.loading') : nickname}
                {isVerified && (
                  <span className={styles.verifiedPill}>{t('mypage.verifiedBadge')}</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/mypage/profile')}
          >
            {t('mypage.profileEdit')}
          </button>
        </div>

        <div className={styles.section}>{t('mypage.sectionActivity')}</div>

        <div className={styles.list}>
          {MY_ACTIVITY.map((item) => (
            <div key={item.label} className={styles.item} onClick={() => navigate(item.path)}>
              <div className={styles.itemTitle}>{item.label}</div>
              <span className={styles.arrow}>›</span>
            </div>
          ))}
        </div>

        <div className={styles.section}>{t('mypage.sectionSettings')}</div>

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
