import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './NotificationSettingsPage.module.css';

const NOTIFICATION_ITEMS = [
  { key: 'transfer', label: '송금 완료 알림' },
  { key: 'receive', label: '입금 완료 알림' },
  { key: 'exchange', label: '환전 완료 알림' },
  { key: 'fraud', label: '이상거래 탐지 알림' },
  { key: 'docAnalysis', label: '문서 분석 완료 알림' },
  { key: 'community', label: '커뮤니티 댓글 알림' },
] as const;

type NotifKey = (typeof NOTIFICATION_ITEMS)[number]['key'];

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<NotifKey, boolean>>({
    transfer: true,
    receive: true,
    exchange: false,
    fraud: true,
    docAnalysis: false,
    community: true,
  });

  const toggle = (key: NotifKey) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="알림 설정" onBack={() => navigate(-1)} />

        <div className={styles.list}>
          {NOTIFICATION_ITEMS.map(({ key, label }) => (
            <div key={key} className={styles.item} onClick={() => toggle(key)}>
              <span className={styles.itemLabel}>{label}</span>
              <div className={`${styles.toggle} ${settings[key] ? styles.toggleOn : ''}`} />
            </div>
          ))}
        </div>

        <button type="button" className={styles.primaryBtn} onClick={() => navigate(-1)}>
          저장
        </button>
      </div>

      <BottomNav activeIndex={3} />
    </div>
  );
}
