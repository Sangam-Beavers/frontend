import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import Toast, { type ToastVariant } from '@/components/common/Toast';
import {
  SETTING_LANGUAGES,
  LANGUAGE_LABEL_TO_CODE,
  LANGUAGE_CODE_TO_LABEL,
  LANGUAGE_NATIVE_NAMES,
} from '@/constants/languages';
import { ApiException } from '@/api/client';
import { ROUTES } from '@/constants/routes';
import { useMyLanguage, useUpdateLanguage } from '@/hooks/useLanguage';
import styles from './LanguageSettingsPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;
const DEFAULT_LABEL: (typeof LANGUAGES)[number] = '한국어';

export default function LanguageSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data, isLoading } = useMyLanguage();
  const update = useUpdateLanguage();

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
        showToast(t('language.successToast'), 'success');
        // 토스트가 보이고 살짝 뒤 자연스럽게 이동.
        window.setTimeout(
          () => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE)),
          700
        );
      },
      onError: (e) => {
        const code = e instanceof ApiException ? e.code : null;
        const msg =
          code === 'COMMON4001'
            ? t('language.errorEmpty')
            : code === 'MEMBER4001'
              ? t('language.errorMemberNotFound')
              : t('language.errorGeneric');
        showToast(msg, 'error');
      },
    });
  };

  const LABEL_TO_OPTION_KEY: Record<(typeof LANGUAGES)[number], string> = {
    한국어: 'language.options.ko',
    영어: 'language.options.en',
    베트남어: 'language.options.vi',
    필리핀어: 'language.options.fil',
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar
          title={t('language.title')}
          onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE))}
        />

        {isLoading ? (
          <div className={styles.loading}>{t('common.loading')}</div>
        ) : (
          <div className={styles.list}>
            {LANGUAGES.map((lang) => (
              <div
                key={lang}
                className={`${styles.item} ${selected === lang ? styles.itemSelected : ''}`}
                onClick={() => setOverride(lang)}
              >
                <span className={styles.itemLabel}>
                  {(() => {
                    const code = LANGUAGE_LABEL_TO_CODE[lang];
                    const localized = t(LABEL_TO_OPTION_KEY[lang]);
                    const native = LANGUAGE_NATIVE_NAMES[code];
                    return localized === native ? localized : `${localized} (${native})`;
                  })()}
                </span>
                {selected === lang ? (
                  <span className={styles.pill}>{t('language.select')}</span>
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
          {update.isPending ? t('language.saving') : t('language.save')}
        </button>
      </div>

      <Toast message={toast?.msg ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
