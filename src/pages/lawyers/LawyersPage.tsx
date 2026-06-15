import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import ScreenHeader from '@/components/layout/ScreenHeader';
import LawyerCard from '@/components/lawyers/LawyerCard';
import LawyerTabs from '@/components/lawyers/LawyerTabs';
import { LAWYERS_MOCK } from '@/mocks/lawyersMock';
import type { LawyerTabKey } from '@/types/lawyer';
import styles from './LawyersPage.module.css';

/**
 * 변호사 상담(광고/홍보) 페이지 — 이슈 #221.
 * 백엔드 연동 없이 하드코딩 mock({@link LAWYERS_MOCK})으로 변호사 광고 목록을 노출한다.
 * 홈 '변호사 상담' 알림 카드에서 진입한다.
 *
 * <p>상단 영역(헤더~탭)은 ScreenHeader로 스크롤 영역 밖에 고정하고, 그 아래 안내·변호사 목록만 스크롤된다.
 */
export default function LawyersPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<LawyerTabKey>('all');

  const lawyers =
    active === 'all'
      ? LAWYERS_MOCK
      : LAWYERS_MOCK.filter((lawyer) => lawyer.categories.includes(active));

  return (
    <>
      <ScreenHeader>
        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="뒤로">
            ‹
          </button>
          <div className={styles.brand}>
            <span className={styles.logoBox} />
            Global Bridge
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="검색">
              🔍
            </button>
            <button className={styles.iconBtn} aria-label="알림">
              🔔
            </button>
          </div>
        </header>

        <p className={styles.subtitle}>외국인 노동자를 위한 법률 전문가 연결</p>
        <h1 className={styles.pageTitle}>변호사 상담</h1>

        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>실시간 상담 가능 변호사</span>
          <span className={styles.moreLink}>더 보기 ›</span>
        </div>

        <LawyerTabs active={active} onChange={setActive} />
      </ScreenHeader>

      <div className={styles.notice}>
        <span className={styles.noticeIcon}>ℹ️</span>
        <div className={styles.noticeText}>
          <b>이 페이지는 변호사 광고(홍보) 페이지입니다.</b>
          <p>외국인 노동자를 위한 법률 전문가 정보와 상담 연결을 제공합니다.</p>
        </div>
      </div>

      <div className={styles.list}>
        {lawyers.length > 0 ? (
          lawyers.map((lawyer) => <LawyerCard key={lawyer.id} lawyer={lawyer} />)
        ) : (
          <div className={styles.empty}>해당 분야의 상담 가능한 변호사가 없습니다.</div>
        )}
      </div>

      <button className={styles.cta} onClick={() => navigate(ROUTES.DOC_ANALYSIS)}>
        <span className={styles.ctaIcon}>📄</span>
        <span className={styles.ctaCopy}>
          <b>AI 문서 분석 결과에서 바로</b>
          <span>변호사 상담으로 연결해 보세요!</span>
        </span>
        <span className={styles.ctaBtn}>문서 분석하기 ›</span>
      </button>
    </>
  );
}
