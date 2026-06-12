import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import styles from './AdminAppPage.module.css';

const MENU = [
  { label: '공지사항 관리', path: ROUTES.ADMIN_NOTICES },
  { label: 'FAQ 관리', path: ROUTES.ADMIN_FAQS },
  { label: '수수료 정책', path: ROUTES.ADMIN_FEE_POLICIES },
  { label: '서비스 설정', path: ROUTES.ADMIN_SERVICE_SETTINGS },
  { label: '회원 관리', path: ROUTES.ADMIN_MEMBERS },
  { label: '신고 관리', path: ROUTES.ADMIN_REPORTS },
];

export default function AdminAppPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>앱 관리</span>
        <div style={{ width: 40 }} />
      </div>
      <div className={styles.section}>관리 메뉴</div>
      <div className={styles.list}>
        {MENU.map((item) => (
          <button
            key={item.path}
            type="button"
            className={styles.item}
            onClick={() => navigate(item.path)}
          >
            <span>{item.label}</span>
            <span className={styles.arrow}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
