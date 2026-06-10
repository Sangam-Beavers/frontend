import { useId } from 'react';

interface IdenticonProps {
  /** 사용자별 고정 시드. publicId(UUID) 권장, 없으면 nickname 등 안정적인 값. */
  seed: string;
  /** 표시 크기(px). 기본은 부모 컨테이너를 채움. */
  size?: number | string;
  className?: string;
}

/**
 * 무의존성 abstract(geometric) 아바타.
 *
 * <p>시드를 32비트 해시로 바꾼 뒤 3개의 색 도형을 결정적으로 배치/회전/블러해
 * 매끈한 추상 패턴을 만든다(boring-avatars의 marble 알고리즘 재구현). 같은 시드 →
 * 항상 같은 그림이라 사진 미설정 사용자도 식별 가능하다. 외부 패키지·네트워크 호출 없음.
 *
 * <p>원형 mask가 적용돼 있어 부모의 원형 프레임 안에 그대로 들어간다.
 */
const SIZE = 80;
const ELEMENTS = 3;

// 식별성을 위해 색상에 변화를 주되 앱의 블루 톤과 어울리는 팔레트.
const COLORS = ['#2563eb', '#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

/** 문자열 → 양의 32비트 정수 해시(djb2 변형, boring-avatars와 동일). */
function hashCode(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash; // 32비트로 강제
  }
  return Math.abs(hash);
}

/** number의 nth번째 자리 숫자. */
function getDigit(number: number, nth: number): number {
  return Math.floor((number / Math.pow(10, nth)) % 10);
}

/** range 내 값을 반환하되, index 자리 숫자가 짝수면 부호를 뒤집어 좌우/상하 분포를 만든다. */
function getUnit(number: number, range: number, index?: number): number {
  const value = number % range;
  if (index && getDigit(number, index) % 2 === 0) return -value;
  return value;
}

interface ShapeProps {
  color: string;
  translateX: number;
  translateY: number;
  rotate: number;
  scale: number;
}

function buildShapes(seed: string): ShapeProps[] {
  const num = hashCode(seed);
  return Array.from({ length: ELEMENTS }, (_, i) => ({
    color: COLORS[(num + i) % COLORS.length],
    translateX: getUnit(num * (i + 1), SIZE / 10, 1),
    translateY: getUnit(num * (i + 1), SIZE / 10, 2),
    scale: 1.2 + getUnit(num * (i + 1), SIZE / 20) / 10,
    rotate: getUnit(num * (i + 1), 360, 1),
  }));
}

export default function Identicon({ seed, size = '100%', className }: IdenticonProps) {
  // mask/filter id는 한 페이지에 여러 개 렌더돼도 충돌하지 않게 고유화.
  const uid = useId().replace(/:/g, '');
  const maskId = `idmask-${uid}`;
  const filterId = `idblur-${uid}`;
  const shapes = buildShapes(seed || '?');
  const center = SIZE / 2;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={SIZE} height={SIZE}>
        <rect width={SIZE} height={SIZE} rx={SIZE * 2} fill="#fff" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect width={SIZE} height={SIZE} fill={shapes[0].color} />
        <path
          filter={`url(#${filterId})`}
          d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l4.014 35.43-13.502 5.198 15.402 5.341z"
          fill={shapes[1].color}
          transform={`translate(${shapes[1].translateX} ${shapes[1].translateY}) rotate(${shapes[1].rotate} ${center} ${center}) scale(${shapes[1].scale})`}
        />
        <path
          filter={`url(#${filterId})`}
          style={{ mixBlendMode: 'overlay' }}
          d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
          fill={shapes[2].color}
          transform={`translate(${shapes[2].translateX} ${shapes[2].translateY}) rotate(${shapes[2].rotate} ${center} ${center}) scale(${shapes[2].scale})`}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x={0}
          y={0}
          width={SIZE}
          height={SIZE}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={7} result="blur" />
        </filter>
      </defs>
    </svg>
  );
}
