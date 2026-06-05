import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';

interface UsePagedPostsParams {
  /** 카테고리 필터 (경로에 종속 — URL 쿼리에는 싣지 않는다). */
  category?: string;
  sort?: string;
  size?: number;
}

/**
 * 페이지 번호 + 검색을 URL 쿼리(`?page=`, `?keyword=`)로 관리하는 게시글 목록 hook.
 *
 * <p>URL을 단일 진실 소스로 둔다 — 게시글 상세로 갔다 뒤로 오면 브라우저가 URL을 복원하므로
 * 보던 페이지·검색어가 그대로 유지된다(로컬 state면 언마운트 시 초기화되는 문제 해결).
 *
 * <p>검색 입력은 로컬(searchQuery)로 받고 디바운스 후 URL keyword로 반영한다(타이핑마다 요청·
 * 히스토리 오염 방지, replace 사용). 검색어가 바뀌면 page를 떨궈 1페이지부터 본다.
 *
 * <p>페이지/검색 변경은 모두 history 오염을 막기 위해 replace로 갈음한다 — 뒤로 가기는
 * "목록 진입 직전"으로 한 번에 빠져나가고, 상세→목록 복귀 시에는 마지막 상태가 복원된다.
 *
 * @example
 *   const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
 *     usePagedPosts({ category: 'JOB' });
 */
export function usePagedPosts({ category, sort, size }: UsePagedPostsParams = {}, delay = 300) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL이 진실 — 뒤로 가기 시 그대로 복원된다.
  const keyword = searchParams.get('keyword') ?? '';
  const rawPage = Number(searchParams.get('page'));
  // URL은 1-index(사람 친화), 내부/백엔드는 0-index.
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage - 1 : 0;

  // 검색 입력 라이브 값 — 마운트 시 URL keyword로 초기화(뒤로 가기 복원 포함).
  const [searchQuery, setSearchQuery] = useState(keyword);

  // 디바운스 후, 입력이 실제로 URL keyword와 달라졌을 때만 URL 갱신.
  // (마운트 직후 searchQuery===keyword면 no-op이라 복원된 page를 건드리지 않는다.)
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchQuery.trim();
      if (next === keyword) return;
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next) updated.set('keyword', next);
          else updated.delete('keyword');
          updated.delete('page'); // 검색어가 바뀌면 1페이지부터
          return updated;
        },
        { replace: true }
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [searchQuery, keyword, delay, setSearchParams]);

  const query = usePosts({
    category,
    keyword: keyword || undefined,
    sort,
    size,
    page,
  });

  const goToPage = (next: number) => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        if (next <= 0) updated.delete('page');
        else updated.set('page', String(next + 1)); // 0-index → URL 1-index
        return updated;
      },
      { replace: true }
    );
    // 실제 스크롤 컨테이너는 MobileScreen의 .content(window가 아님) — 그걸 맨 위로 올린다.
    document.querySelector<HTMLElement>('[data-scroll-root]')?.scrollTo({ top: 0 });
  };

  return { ...query, page, goToPage, keyword, searchQuery, setSearchQuery };
}
