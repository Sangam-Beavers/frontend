import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ScreenHeaderSlotContext } from '@/components/layout/MobileScreen';
import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  children: ReactNode;
}

/**
 * 화면 상단 고정 헤더(앱바). 내용을 MobileScreen의 스크롤 영역 밖 슬롯으로 portal해 항상 고정한다.
 *
 * <p>sticky가 아니라 실제로 스크롤 컨테이너 바깥에 있으므로, 스크롤 시 떨림이나 콘텐츠 비침이 없다.
 * 페이지는 고정하고 싶은 상단부(헤더/탭/검색 등)를 이 컴포넌트로 감싸고, 나머지는 그대로 두면 스크롤된다.
 *
 * <p>슬롯이 아직 mount되지 않은 첫 프레임에는 아무것도 렌더하지 않는다(슬롯 준비 후 자동 표시).
 */
export default function ScreenHeader({ children }: ScreenHeaderProps) {
  const slot = useContext(ScreenHeaderSlotContext);
  if (!slot) {
    return null;
  }
  return createPortal(<div className={styles.pinned}>{children}</div>, slot);
}
