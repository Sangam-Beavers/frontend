import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast, { type ToastVariant } from '@/components/common/Toast';
import { startLogout } from '@/auth/logout';
import { ApiException } from '@/api/client';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useMyProfile } from '@/hooks/useMyProfile';
import styles from './WithdrawPage.module.css';

type Step = 'reason' | 'info';

/** 탈퇴 사유 옵션 — 카카오페이/Toss 패턴. 마지막 '기타'는 자유 입력. */
const REASONS = [
  '서비스를 잘 사용하지 않아요',
  '다른 송금 서비스를 사용해요',
  '기능이 부족해요',
  '오류가 자주 발생해요',
  '개인정보 보호가 걱정돼요',
  '기타',
] as const;

/**
 * 회원 탈퇴 화면 (다단계 흐름 — Toss/카카오페이 패턴).
 *
 * <p>1단계 (reason): 탈퇴 사유 선택 + 자유 입력(선택). 사유 자체는 백엔드로 전송하지 않음
 *     (현재 API 스펙엔 사유 필드 없음). 사용자에게 한 번 더 의사 확인 + 미래 통계용 로컬 로깅 자리.
 * <p>2단계 (info): 잃게 되는 데이터 안내 + 최종 ConfirmDialog 트리거.
 * <p>최종 확인 (ConfirmDialog): 실제 DELETE /members/me 호출. 성공 시 startLogout()으로
 *     로컬 토큰 정리 + IdP 세션 종료 + /login redirect.
 *
 * <p>실패 처리: 500 COMMON5000(IdP 연동 실패, 로컬 무변경) → 재시도 안내 토스트.
 * 401 AUTH4011은 apiClient interceptor가 자동 처리(이미 만료 → /login).
 */
export default function WithdrawPage() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const withdraw = useWithdraw();

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<string | null>(null);
  const [reasonEtc, setReasonEtc] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);
  const showToast = (msg: string, variant: ToastVariant = 'success') => setToast({ msg, variant });

  const canProceedFromReason = !!reason && (reason !== '기타' || reasonEtc.trim().length > 0);

  const handleConfirmWithdraw = () => {
    withdraw.mutate(undefined, {
      onSuccess: () => {
        // 토큰 정리 + IdP end_session → /login redirect (location.href 이동이라 setState 후속 X)
        startLogout();
      },
      onError: (e) => {
        const code = e instanceof ApiException ? e.code : null;
        const msg =
          code === 'COMMON5000'
            ? '서버에 일시적 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
            : code === 'MEMBER4001'
              ? '회원 정보를 찾을 수 없어요.'
              : '탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.';
        showToast(msg, 'error');
        setConfirmOpen(false);
      },
    });
  };

  return (
    <>
      <TopBar
        title="회원 탈퇴"
        onBack={() => (step === 'info' ? setStep('reason') : navigate(-1))}
      />

      {step === 'reason' && (
        <div className={styles.section}>
          <h2 className={styles.heading}>탈퇴하시는 이유를 알려주세요</h2>
          <p className={styles.subheading}>
            서비스 개선에 큰 도움이 됩니다. 사유는 외부에 공유되지 않아요.
          </p>

          <div className={styles.reasonList}>
            {REASONS.map((r) => (
              <label
                key={r}
                className={`${styles.reasonItem} ${reason === r ? styles.reasonItemSelected : ''}`}
              >
                <input
                  type="radio"
                  name="withdraw-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className={styles.reasonRadio}
                />
                <span className={styles.reasonLabel}>{r}</span>
              </label>
            ))}
          </div>

          {reason === '기타' && (
            <textarea
              className={styles.etcInput}
              placeholder="자세한 사유를 알려주세요 (최대 200자)"
              maxLength={200}
              value={reasonEtc}
              onChange={(e) => setReasonEtc(e.target.value)}
            />
          )}

          <div className={styles.fixedBtn}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canProceedFromReason}
              onClick={() => setStep('info')}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {step === 'info' && (
        <div className={styles.section}>
          <h2 className={styles.heading}>
            {profile?.nickname ? `${profile.nickname}님, ` : ''}정말 떠나시겠어요?
          </h2>
          <p className={styles.subheading}>탈퇴하면 아래 데이터가 모두 사라져요.</p>

          <ul className={styles.lossList}>
            <li>
              <strong>전자지갑 잔액</strong> — 출금 후 탈퇴를 권장합니다
            </li>
            <li>
              <strong>송금·환전·충전 내역</strong> — 복구할 수 없어요
            </li>
            <li>
              <strong>커뮤니티 작성글·댓글</strong> — 닉네임이 "탈퇴한 사용자"로 표시돼요
            </li>
            <li>
              <strong>인증 배지</strong> — 재가입 시 신분증 인증을 다시 받아야 해요
            </li>
            <li>
              <strong>등록된 계좌·구독·정기 송금</strong> — 모두 해제돼요
            </li>
          </ul>

          <div className={styles.warningCard}>
            동일한 이메일로 30일 내 재가입은 어려울 수 있어요. 정말로 떠나시기 전에 한 번만 더
            생각해 주세요.
          </div>

          <div className={styles.fixedBtn}>
            <div className={styles.btnRow}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setStep('reason')}
                disabled={withdraw.isPending}
              >
                이전
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => setConfirmOpen(true)}
                disabled={withdraw.isPending}
              >
                탈퇴할게요
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="마지막 확인"
          message="정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmLabel="탈퇴"
          cancelLabel="취소"
          danger
          loading={withdraw.isPending}
          onConfirm={handleConfirmWithdraw}
          onCancel={() => {
            if (withdraw.isPending) return;
            setConfirmOpen(false);
          }}
        />
      )}

      <Toast message={toast?.msg ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
