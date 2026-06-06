import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 스크롤 위치 복원 — 영속 스크롤 컨테이너(`.content[data-scroll-root]`)용.
 *
 * <p>MainLayout처럼 라우트가 바뀌어도 살아있는 레이아웃에서 한 번 호출한다. 컨테이너가 라우트
 * 간 공유되므로 React Router 기본 동작으로는 위치가 복원되지 않는다 — 특히 목록→상세→뒤로 시,
 * 짧은 상세 화면이 컨테이너 scrollTop을 잘라 목록으로 돌아오면 맨 위로 보이는 문제가 있다.
 *
 * <p>history 엔트리(location.key)별 scrollTop을 저장해 두고:
 * - 뒤로/앞으로(POP) → 저장된 위치로 복원
 * - 새 이동(PUSH/REPLACE) → 맨 위 (새 카테고리·상세 진입 등은 top이 자연스럽다)
 *
 * <p>저장은 **사용자가 직접 스크롤(wheel·touch·pointer·key)할 때만** 한다. 복원용 프로그램적
 * 스크롤은 저장에서 제외 — 안 그러면 복원이 늦게 잡힌 높이로 잘린 값을 도로 저장해, 왕복할수록
 * 위치가 조금씩 위로 줄어든다. 또 복원은 목표 높이가 늦게 잡혀도 맞도록 몇 프레임 재시도한다.
 */
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

    // 사용자가 실제로 스크롤한 위치만 저장(프로그램적 복원 스크롤은 restoring 가드로 제외).
    const onScroll = () => {
      if (restoring.current) return;
      positions.current.set(key, el.scrollTop);
    };
    // 사용자 입력이 시작되면 이후 스크롤은 '사용자 것' — 저장 재개.
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

    const target = navType === 'POP' ? (positions.current.get(location.key) ?? 0) : 0;
    // 사용자가 입력하기 전까지 저장 차단(프로그램 스크롤이 저장값을 오염시키지 않게).
    restoring.current = true;

    let raf = 0;
    let tries = 0;
    const apply = () => {
      // 사용자가 스크롤로 끼어들면(restoring 해제) 복원 중단 — 사용자의 스크롤을 가로채지 않는다.
      if (!restoring.current) return;
      el.scrollTop = target;
      tries += 1;
      // 콘텐츠 높이가 늦게 잡혀 목표에 못 미치면(clamp) 다음 프레임 재시도 — 목표 도달/한계 시 멈춘다.
      if (target > 0 && el.scrollTop < target - 1 && tries < 30) {
        raf = requestAnimationFrame(apply);
      }
    };
    apply();

    return () => cancelAnimationFrame(raf);
  }, [location.key, navType]);
}
