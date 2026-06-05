import { useNavigate } from 'react-router-dom';
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
 * <p>검색(바 토글) · 글쓰기(작성 화면) · 내 관심글. 전체/카테고리 7개 화면이 공통으로 사용해
 * 글쓰기·검색·관심글 진입을 일원화한다. 내 관심글은 liked API 미연동이라 현재 placeholder다.
 */
export default function CommunityMenu({
  onToggleSearch,
  searchActive = false,
}: CommunityMenuProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.menu}>
      <button
        type="button"
        className={`${styles.item} ${searchActive ? styles.itemActive : ''}`}
        aria-pressed={searchActive}
        onClick={onToggleSearch}
      >
        <span className={styles.icon}>🔍</span>
        검색
      </button>
      <button
        type="button"
        className={`${styles.item} ${styles.primary}`}
        onClick={() => navigate(ROUTES.COMMUNITY_WRITE)}
      >
        <span className={styles.icon}>✏️</span>
        글쓰기
      </button>
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          /* TODO: liked(내 관심글) API 연동 후 목록 화면으로 이동. */
        }}
      >
        <span className={styles.icon}>♥</span>내 관심글
      </button>
    </div>
  );
}
