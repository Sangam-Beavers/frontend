import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import { memberApi } from '@/api/member';
import Identicon from '@/components/common/Identicon';
import TopBar from '@/components/navigation/TopBar';
import { SETTING_LANGUAGES, LANGUAGE_NATIVE_NAMES } from '@/constants/languages';
import { ROUTES } from '@/constants/routes';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useUpdateMyProfile } from '@/hooks/useUpdateMyProfile';
import type { AvatarTone } from '@/types/community';
import { trustGradeToTone } from '@/utils/trustGrade';
import styles from './ProfileEditPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;

const OPTION_LABEL_KEY: Record<(typeof SETTING_LANGUAGES)[number], string> = {
  한국어: 'language.options.ko',
  영어: 'language.options.en',
  베트남어: 'language.options.vi',
  필리핀어: 'language.options.fil',
};

const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  default: styles.avatarNewcomer,
};

const LANGUAGE_CODE_TO_LABEL: Record<string, string> = {
  ko: '한국어',
  zh: '중국어',
  vi: '베트남어',
  th: '태국어',
  en: '영어',
  fil: '필리핀어',
};

const LANGUAGE_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODE_TO_LABEL).map(([code, label]) => [label, code])
);

export default function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useMyProfile();
  const update = useUpdateMyProfile();

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<null | 'ok' | 'fail'>(null);
  const [language, setLanguage] = useState('한국어');
  const [bio, setBio] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 프로필 이미지 색조(hue) 회전 각도. "색깔 변경" 버튼을 누를 때마다 새 각도로 바꿔 사진/Identicon 색을
  // 무작위로 변경한다. 저장(PATCH /me) 시 백엔드에 영구 저장되고, 프로필 도착 시 저장값으로 초기화된다.
  const [avatarHue, setAvatarHue] = useState(0);

  const randomizeAvatarColor = () => {
    // 직전 각도와 충분히 다르게(>=40도) 골라 "색이 안 바뀐 것 같은" 인접 값 반복을 피한다.
    setAvatarHue((prev) => {
      let next = prev;
      while (Math.abs(next - prev) < 40) {
        next = Math.floor(Math.random() * 360);
      }
      return next;
    });
  };

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!profile || initializedRef.current) return;
    setNickname(profile.nickname);
    setLanguage(LANGUAGE_CODE_TO_LABEL[profile.language] ?? '한국어');
    setBio(profile.bio ?? '');
    setAvatarHue(profile.avatar_hue ?? 0);
    initializedRef.current = true;
  }, [profile]);

  const avatarSeed = profile?.public_id ?? nickname;

  const avatarToneClass =
    AVATAR_TONE_CLASS[trustGradeToTone(profile?.trust_grade)] ?? styles.avatarNewcomer;

  const checkNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    if (profile && trimmed === profile.nickname) {
      setNicknameStatus('ok');
      return;
    }
    try {
      const res = await memberApi.checkNickname(trimmed);
      setNicknameStatus(res.available ? 'ok' : 'fail');
    } catch {
      // 일시 오류는 상태를 흐려둔다 — 사용자가 다시 시도 가능. 저장 시 백엔드가 최종 검증.
      setNicknameStatus(null);
    }
  };

  const handleSave = () => {
    setSubmitError(null);
    const trimmedNickname = nickname.trim();
    const trimmedBio = bio.trim();
    if (!trimmedNickname) {
      setSubmitError(t('mypage2.profile.errors.nicknameRequired'));
      return;
    }
    const languageCode = LANGUAGE_LABEL_TO_CODE[language] ?? 'ko';
    update.mutate(
      {
        nickname: trimmedNickname,
        language: languageCode,
        // 백엔드 컬럼은 nullable이라 빈 문자열을 null로 정규화(저장 후 다시 빈 값으로 표시).
        bio: trimmedBio === '' ? null : trimmedBio,
        // "색깔 변경"으로 고른 색조를 닉네임/언어/소개와 함께 영구 저장한다.
        avatar_hue: avatarHue,
      },
      {
        onSuccess: () => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE)),
        onError: (err) => {
          if (err instanceof ApiException) {
            if (err.code === 'MEMBER4003') {
              setNicknameStatus('fail');
              setSubmitError(t('mypage2.profile.errors.nicknameTaken'));
              return;
            }
            setSubmitError(err.message || t('mypage2.profile.errors.saveFailed'));
            return;
          }
          setSubmitError(t('mypage2.profile.errors.saveFailed'));
        },
      }
    );
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar
          title={t('mypage2.profile.title')}
          onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE))}
        />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div
            className={`${styles.avatar} ${avatarToneClass}`}
            style={{ filter: `hue-rotate(${avatarHue}deg)` }}
          >
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className={styles.avatarImg} />
            ) : (
              <Identicon seed={avatarSeed} />
            )}
          </div>
        </div>
        <button type="button" className={styles.secondaryBtn} onClick={randomizeAvatarColor}>
          {t('mypage2.profile.changeColor')}
        </button>

        {/* Nickname */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nickname">
            {t('mypage2.profile.nicknameLabel')}
          </label>
          <div className={styles.inputRow}>
            <input
              id="nickname"
              type="text"
              className={styles.input}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameStatus(null);
              }}
            />
            <button type="button" className={styles.inlineBtn} onClick={checkNickname}>
              {t('mypage2.profile.checkDuplicate')}
            </button>
          </div>
          {nicknameStatus === 'ok' && (
            <p className={styles.fieldOk}>{t('mypage2.profile.nicknameOk')}</p>
          )}
          {nicknameStatus === 'fail' && (
            <p className={styles.fieldFail}>{t('mypage2.profile.nicknameFail')}</p>
          )}
        </div>

        {/* Language */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="language">
            {t('mypage2.profile.languageLabel')}
          </label>
          <select
            id="language"
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => {
              const code = LANGUAGE_LABEL_TO_CODE[l] ?? 'ko';
              const localized = t(OPTION_LABEL_KEY[l]);
              const native = LANGUAGE_NATIVE_NAMES[code];
              const display = localized === native ? localized : `${localized} (${native})`;
              return (
                <option key={l} value={l}>
                  {display}
                </option>
              );
            })}
          </select>
        </div>

        {/* Bio */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bio">
            {t('mypage2.profile.bioLabel')}
          </label>
          <textarea
            id="bio"
            className={styles.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {submitError && (
          <p className={styles.fieldFail} role="alert">
            {submitError}
          </p>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={update.isPending}
        >
          {update.isPending ? t('mypage2.profile.saving') : t('mypage2.profile.save')}
        </button>
      </div>
    </>
  );
}
