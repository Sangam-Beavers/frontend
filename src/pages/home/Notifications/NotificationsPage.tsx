import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './NotificationsPage.module.css';

type NotifCategory = '전체' | '거래' | '문서' | '커뮤니티' | '보안';

interface NotifItem {
  id: string;
  icon: string;
  title: string;
  meta: string;
  category: NotifCategory;
  unread?: boolean;
}

const NOTIFICATIONS: NotifItem[] = [
  {
    id: '1',
    icon: '💸',
    title: '송금이 완료되었습니다',
    meta: 'Linh에게 VND ₫1,200,000 송금 완료 · 방금 전',
    category: '거래',
    unread: true,
  },
  {
    id: '2',
    icon: '💱',
    title: '환전이 완료되었습니다',
    meta: 'KRW ₩100,000 → USD $72.45 · 12분 전',
    category: '거래',
  },
  {
    id: '3',
    icon: '⚠️',
    title: '이상거래 탐지 안내',
    meta: '평소와 다른 로그인 위치가 감지되었습니다 · 1시간 전',
    category: '보안',
  },
  {
    id: '4',
    icon: '📄',
    title: '문서 분석 결과가 준비되었습니다',
    meta: '근로계약서 분석 결과를 확인해보세요 · 어제',
    category: '문서',
  },
  {
    id: '5',
    icon: '💬',
    title: '내 게시글에 댓글이 달렸습니다',
    meta: '"좋은 정보 감사합니다!" · 어제',
    category: '커뮤니티',
  },
  {
    id: '6',
    icon: '🎟️',
    title: '송금 쿠폰이 적립되었습니다',
    meta: '도장 1개 적립, 5개 모으면 수수료 1회 면제 · 2일 전',
    category: '거래',
  },
];

const TABS: NotifCategory[] = ['전체', '거래', '문서', '커뮤니티', '보안'];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotifCategory>('전체');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filtered =
    activeTab === '전체' ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.category === activeTab);

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));

  const isUnread = (item: NotifItem) => item.unread && !readIds.has(item.id);

  return (
    <>
      <TopBar
        title="알림"
        onBack={() => navigate(-1)}
        rightAction={
          <button className={styles.readAllBtn} onClick={markAllRead}>
            ✓
          </button>
        }
      />

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.noticeIcon}>{item.icon}</div>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>
                {item.title}
                {isUnread(item) && <span className={styles.unreadDot} />}
              </div>
              <div className={styles.itemMeta}>{item.meta}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>알림이 없습니다</div>}
      </div>

      <button type="button" className={styles.ghostBtn} onClick={markAllRead}>
        모두 읽음 처리
      </button>
    </>
  );
}
