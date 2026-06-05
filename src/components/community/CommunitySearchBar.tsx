import styles from './CommunitySearchBar.module.css';

interface CommunitySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** 커뮤니티 카테고리 화면의 검색 입력바 (돋보기 토글로 노출). */
export default function CommunitySearchBar({
  value,
  onChange,
  placeholder = '이 게시판에서 검색',
}: CommunitySearchBarProps) {
  return (
    <input
      className={styles.search}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  );
}
