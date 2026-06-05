import { useEffect, useState } from 'react';

/**
 * 검색 입력 디바운스 hook — 입력값(searchQuery)을 delay(기본 300ms) 후 keyword로 반영한다.
 *
 * <p>커뮤니티 목록/카테고리 화면이 공용으로 사용. keyword를 usePosts에 넘기면
 * 매 타이핑마다 요청하지 않고 입력이 멈춘 뒤에만 서버 검색이 나간다.
 *
 * @example
 *   const { searchQuery, setSearchQuery, keyword } = useDebouncedKeyword();
 *   usePosts({ category: 'JOB', keyword: keyword || undefined });
 */
export function useDebouncedKeyword(delay = 300) {
  const [searchQuery, setSearchQuery] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(searchQuery.trim()), delay);
    return () => clearTimeout(timer);
  }, [searchQuery, delay]);

  return { searchQuery, setSearchQuery, keyword };
}
