// ─────────────────────────────────────────────────────────────
// utils/input.ts — 입력값 정제 공용 유틸
// ─────────────────────────────────────────────────────────────

/**
 * 송금 PIN 입력 정제: 숫자만 남기고 6자리까지 자른다.
 *
 * 사용처: TransferPinSetupPage(설정), TransferAuthPage(검증) — 두 화면이 동일 규칙을 공유한다.
 * 백엔드 검증 규칙(@Pattern \d{6})과 일치.
 */
export const sanitizePinInput = (value: string): string => value.replace(/\D/g, '').slice(0, 6);
