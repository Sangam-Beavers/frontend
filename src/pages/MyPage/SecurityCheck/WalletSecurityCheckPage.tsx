import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useSecuritySummary } from '@/hooks/useSecuritySummary';
import styles from './WalletSecurityCheckPage.module.css';

/**
 * 전자지갑 보안 점검 상세 화면 (이슈 #225).
 * 홈 "이상거래 탐지" 카드에서 진입. GET /wallets/me/security-summary 결과를 규칙별로 보여준다.
 * 백엔드는 새 데이터를 만들지 않고 기존 거래를 읽어 계산만 한다(읽기 전용).
 */
export default function WalletSecurityCheckPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSecuritySummary();

  return (
    <>
      <TopBar title="전자지갑 보안 점검" onBack={() => navigate(-1)} />

      {isLoading ? (
        <div className={styles.state}>점검 결과를 불러오는 중…</div>
      ) : error || !data ? (
        <div className={styles.state} role="alert">
          점검 결과를 불러오지 못했습니다.
        </div>
      ) : (
        <>
          <div className={`${styles.statusCard} ${styles[`status_${data.status}`]}`}>
            <span className={styles.statusIcon}>{data.status === 'SAFE' ? '🛡️' : '⚠️'}</span>
            <div className={styles.statusBody}>
              <div className={styles.statusTitle}>
                {data.status === 'SAFE' ? '전자지갑이 안전합니다' : '확인이 필요한 거래가 있어요'}
              </div>
              <div className={styles.statusSub}>
                최근 30일 거래 {data.checked_count}건 점검 · 주의 {data.suspicious_count}건
              </div>
              <div className={styles.statusTime}>
                점검 시각 {new Date(data.checked_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.section}>점검 항목</div>
          <div className={styles.list}>
            {data.checks.map((c) => (
              <div key={c.code} className={styles.checkItem}>
                <span
                  className={`${styles.checkMark} ${c.status === 'WARNING' ? styles.warn : styles.ok}`}
                >
                  {c.status === 'WARNING' ? '!' : '✓'}
                </span>
                <div className={styles.checkBody}>
                  <div className={styles.checkLabel}>{c.label}</div>
                  <div className={styles.checkDetail}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {data.flagged_transactions.length > 0 && (
            <>
              <div className={styles.section}>주의 거래</div>
              <div className={styles.list}>
                {data.flagged_transactions.map((tx) => (
                  <div key={tx.public_id} className={styles.txItem}>
                    <div className={styles.txMain}>
                      <div className={styles.txTitle}>
                        {Number(tx.amount).toLocaleString()} {tx.currency_code}
                      </div>
                      <div className={styles.txMeta}>
                        {tx.reason} · {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={styles.txBadge}>주의</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.tips}>
            <div className={styles.tipsTitle}>이런 경우 사기를 의심하세요</div>
            <ul className={styles.tipsList}>
              <li>모르는 사람이 송금을 요청하거나 계좌·비밀번호를 물어볼 때</li>
              <li>“수수료를 먼저 보내라”거나 급하게 송금을 재촉할 때</li>
              <li>고용·비자·환전을 미끼로 개인정보나 인증번호를 요구할 때</li>
            </ul>
          </div>

          <button className={styles.cta} onClick={() => navigate(ROUTES.LAWYERS)}>
            법률 도움이 필요하면 변호사 상담 받기 ›
          </button>
        </>
      )}
    </>
  );
}
