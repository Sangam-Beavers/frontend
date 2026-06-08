import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import styles from './CommunityMenu.module.css';

interface CommunityMenuProps {
  /** 검색 바 토글 — 페이지가 showSearch 상태를 소유한다. */
  onToggleSearch: () => void;
  /** 검색 바가 열려 있는지 — 검색 버튼 활성 표시용. */
  searchActive?: boolean;
}

/**
 * 커뮤니티 공용 메뉴 — 카테고리 탭 바로 아래(설명/배너 위)에 항상 노출되는 3버튼 바.
 *
 * <p>검색(바 토글) · 글쓰기(작성 화면) · 내 관심글(좋아요한 글 목록). 전체/카테고리 7개 화면이
 * 공통으로 사용해 글쓰기·검색·관심글 진입을 일원화한다.
 */
export default function CommunityMenu({
  onToggleSearch,
  searchActive = false,
}: CommunityMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.menu}>
      <button
        type="button"
        className={`${styles.item} ${searchActive ? styles.itemActive : ''}`}
        aria-pressed={searchActive}
        onClick={onToggleSearch}
      >
        <span className={styles.icon}>🔍</span>
        {t('community.search')}
      </button>
      <button
        type="button"
        className={`${styles.item} ${styles.primary}`}
        onClick={() => navigate(ROUTES.COMMUNITY_WRITE)}
      >
        <span className={styles.icon}>✏️</span>
        {t('community.write')}
      </button>
      <button
        type="button"
        className={styles.item}
        onClick={() => navigate(ROUTES.COMMUNITY_LIKED)}
      >
        <span className={styles.icon}>❤️</span>
        {t('community.liked')}
      </button>
    </div>
  );
}
