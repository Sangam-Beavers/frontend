import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import styles from './AdditionalCertCompletePage.module.css';

/**
 * 신분증 인증 완료 화면. 이슈 #108 / 백엔드 #152.
 *
 * <p>인증 통과 시 백엔드(member-service)가 wallet-service에 전자지갑 자동 개설을 위임한다 — 별도
 * 호출 없이 화면이 떠 있는 동안 이미 지갑이 만들어진 상태다(BE fail-open: 실패해도 사용자는 인증
 * 배지를 받음).
 *
 * <p>이어지는 흐름은 <b>송금 PIN 설정</b>이다(송금 시 추가 인증용 6자리 숫자). PIN 미설정 상태로
 * 송금을 시도하면 백엔드가 TRANSFER4009로 거절해 어차피 같은 화면으로 보내지만, 인증 직후
 * 한 번에 끝내는 게 자연스러우므로 주 CTA로 노출한다. `state.fromOnboarding` 플래그를 들고 가서
 * PIN 등록 완료 시 홈으로 바로 가게 한다(TransferPinSetupPage).
 */
export default function AdditionalCertCompletePage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="인증 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>인증 완료 — 전자지갑이 개설되었습니다</div>
        <div className={styles.cardText}>
          프로필에 인증 배지가 표시되고, 이제 충전·송금을 시작할 수 있습니다. 마지막으로 송금 시
          입력할 PIN(숫자 6자리)을 등록해주세요.
        </div>
      </div>

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => navigate(ROUTES.TRANSFER_PIN_SETUP, { state: { fromOnboarding: true } })}
      >
        송금 PIN 설정하기
      </button>
      <button type="button" className={styles.ghostBtn} onClick={() => navigate(ROUTES.HOME)}>
        나중에 하기
      </button>
    </>
  );
}
