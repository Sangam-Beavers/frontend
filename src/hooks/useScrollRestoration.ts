import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// sessionStorage를 Map과 병용하는 이유: scroll passive 이벤트 처리 전에 navigate가 실행되면
// Map에 마지막 scrollTop이 빠지는 타이밍 이슈가 있다. navigate 직전에 saveScroll로 강제
// 저장해두면 POP 복원 시 sessionStorage 값을 우선 사용한다.
export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const positions = useRef<Map<string, number>>(new Map());
  // 복원용 프로그램 스크롤 중에는 저장하지 않는다. 사용자의 실제 입력이 들어와야 해제.
  const restoring = useRef(false);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (!el) return;
    const key = location.key;

    const onScroll = () => {
      if (restoring.current) return;
      const top = el.scrollTop;
      positions.current.set(key, top);
      // sessionStorage에도 백업 — navigate 타이밍 이슈 및 재마운트 후 복원용
      try {
        sessionStorage.setItem(`_srp_${key}`, String(top));
      } catch {}
    };
    const endRestoring = () => {
      restoring.current = false;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', endRestoring, { passive: true });
    el.addEventListener('touchstart', endRestoring, { passive: true });
    el.addEventListener('pointerdown', endRestoring, { passive: true });
    el.addEventListener('keydown', endRestoring);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', endRestoring);
      el.removeEventListener('touchstart', endRestoring);
      el.removeEventListener('pointerdown', endRestoring);
      el.removeEventListener('keydown', endRestoring);
    };
  }, [location.key]);

  // 엔트리 전환 시 — 뒤로가기는 복원, 새 이동은 맨 위. paint 전(useLayoutEffect)에 적용해 깜빡임 방지.
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (!el) return;

    let target = 0;
    if (navType === 'POP') {
      // sessionStorage 우선 — navigate 직전에 saveScroll로 강제 저장한 값이 더 정확하다.
      // 메모리 Map은 scroll 이벤트 타이밍에 따라 마지막 위치가 빠질 수 있어 fallback으로만 사용.
      const ss = sessionStorage.getItem(`_srp_${location.key}`);
      const mem = positions.current.get(location.key);
      target = ss !== null ? Number(ss) : (mem ?? 0);
    }

    restoring.current = true;

    let raf = 0;
    let tries = 0;
    const apply = () => {
      if (!restoring.current) return;
      el.scrollTop = target;
      tries += 1;
      // 콘텐츠 높이가 늦게 잡혀 목표에 못 미치면(clamp) 다음 프레임 재시도.
      if (target > 0 && el.scrollTop < target - 1 && tries < 30) {
        raf = requestAnimationFrame(apply);
      }
    };
    apply();

    return () => cancelAnimationFrame(raf);
  }, [location.key, navType]);
}
