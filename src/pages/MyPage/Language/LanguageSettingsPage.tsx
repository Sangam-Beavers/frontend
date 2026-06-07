import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import Toast, { type ToastVariant } from '@/components/common/Toast';
import {
  SETTING_LANGUAGES,
  LANGUAGE_LABEL_TO_CODE,
  LANGUAGE_CODE_TO_LABEL,
} from '@/constants/languages';
import { ApiException } from '@/api/client';
import { useMyLanguage, useUpdateLanguage } from '@/hooks/useLanguage';
import styles from './LanguageSettingsPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;
const DEFAULT_LABEL: (typeof LANGUAGES)[number] = '한국어';

/**
 * 언어 설정 화면.
 *
 * <p>실 API 연동: 조회({@link useMyLanguage}) + 변경({@link useUpdateLanguage}).
 * 백엔드는 BCP 47 코드(`ko`/`en`/`vi`/`fil`)를, 화면은 한국어 라벨을 사용 →
 * `LANGUAGE_LABEL_TO_CODE` / `LANGUAGE_CODE_TO_LABEL`로 변환.
 *
 * <p>UX (카카오페이/Toss 패턴): 라디오 리스트 + 하단 고정 저장 버튼.
 * 저장 성공 시 토스트 띄우고 자동으로 뒤로 가기. 4개 외 코드(예: 기존 `zh`)가
 * 와도 fallback으로 표시(그대로 노출) — 사용자가 4개 중 하나로 바꿔야 정상화.
 *
 * <p>⚠️ 본 화면은 "선호 언어 메타데이터의 저장/조회"까지만 담당.
 * 실제 화면 다국어 전환(i18next 도입)은 별도 트랙(이슈 B-2 — 커뮤니티 글 AI 자동번역과 함께).
 */
export default function LanguageSettingsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyLanguage();
  const update = useUpdateLanguage();

  // ─── 선택값 계산 (derived state, useEffect 불필요) ────────────────────────
  // 사용자가 화면에서 라디오를 누르면 override가 채워진다. override가 null이면 서버값을 그대로 노출.
  // 서버 데이터가 바뀌어도(invalidate 후) useEffect 동기화 없이 자연스럽게 새 값이 흘러간다.
  // React 19 권장 패턴 (react-hooks/set-state-in-effect 회피).
  const [override, setOverride] = useState<(typeof LANGUAGES)[number] | null>(null);

  const serverCode = data?.language; // BCP 47 (예: 'vi')
  const serverLabel: (typeof LANGUAGES)[number] = serverCode
    ? ((LANGUAGE_CODE_TO_LABEL[serverCode] ?? DEFAULT_LABEL) as (typeof LANGUAGES)[number])
    : DEFAULT_LABEL;
  const selected = override ?? serverLabel;
  const selectedCode = LANGUAGE_LABEL_TO_CODE[selected];
  const isDirty = !!serverCode && selectedCode !== serverCode;

  // 토스트
  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);
  const showToast = (msg: string, variant: ToastVariant = 'success') => setToast({ msg, variant });

  const handleSave = () => {
    if (!selectedCode || !isDirty) return;
    update.mutate(selectedCode, {
      onSuccess: () => {
        showToast('언어가 변경되었습니다.', 'success');
        // 토스트가 보이고 살짝 뒤 자연스럽게 이동.
        window.setTimeout(() => navigate(-1), 700);
      },
      onError: (e) => {
        const code = e instanceof ApiException ? e.code : null;
        const msg =
          code === 'COMMON4001'
            ? '언어 값이 비어 있어요.'
            : code === 'MEMBER4001'
              ? '회원 정보를 찾을 수 없어요.'
              : '변경에 실패했어요. 잠시 후 다시 시도해 주세요.';
        showToast(msg, 'error');
      },
    });
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="언어 설정" onBack={() => navigate(-1)} />

        {isLoading ? (
          <div className={styles.loading}>불러오는 중…</div>
        ) : (
          <div className={styles.list}>
            {LANGUAGES.map((lang) => (
              <div
                key={lang}
                className={`${styles.item} ${selected === lang ? styles.itemSelected : ''}`}
                onClick={() => setOverride(lang)}
              >
                <span className={styles.itemLabel}>{lang}</span>
                {selected === lang ? (
                  <span className={styles.pill}>선택</span>
                ) : (
                  <div className={styles.radio} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!isDirty || update.isPending}
          onClick={handleSave}
        >
          {update.isPending ? '저장 중…' : '저장'}
        </button>
      </div>

      <Toast message={toast?.msg ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
