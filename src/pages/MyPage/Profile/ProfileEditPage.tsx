import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import { memberApi } from '@/api/member';
import Identicon from '@/components/common/Identicon';
import TopBar from '@/components/navigation/TopBar';
import { SETTING_LANGUAGES } from '@/constants/languages';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useUpdateMyProfile } from '@/hooks/useUpdateMyProfile';
import styles from './ProfileEditPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;

/** 백엔드 BCP 47 코드 → 화면 표시 라벨 매핑. 매핑 못 찾으면 '한국어' fallback. */
const LANGUAGE_CODE_TO_LABEL: Record<string, string> = {
  ko: '한국어',
  zh: '중국어',
  vi: '베트남어',
  th: '태국어',
  en: '영어',
};

/**
 * 화면 라벨 → 백엔드 BCP 47 코드 역매핑(저장 시 사용).
 * SETTING_LANGUAGES와 CODE_TO_LABEL의 정합이 깨지면 'ko' fallback — 백엔드에서 거부되지 않게 안전한 기본값.
 */
const LANGUAGE_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODE_TO_LABEL).map(([code, label]) => [label, code])
);

export default function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const update = useUpdateMyProfile();

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<null | 'ok' | 'fail'>(null);
  const [language, setLanguage] = useState('한국어');
  const [bio, setBio] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 폼 초기화는 profile 도착 시 단 한 번만(ref로 가드) — 그 후엔 사용자 입력에 맡긴다.
  // useState lazy initializer를 못 쓰는 이유: 첫 render 시점에 profile은 항상 undefined(비동기 도착).
  // ref 가드를 안 두면 queryClient 재조회로 profile이 다시 들어올 때마다 setState가 사용자 입력을 덮어쓰고
  // cascading render도 발생한다(React 19 비권장 패턴). CodeRabbit PR #91 리뷰 반영.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!profile || initializedRef.current) return;
    setNickname(profile.nickname);
    setLanguage(LANGUAGE_CODE_TO_LABEL[profile.language] ?? '한국어');
    setBio(profile.bio ?? '');
    initializedRef.current = true;
  }, [profile]);

  // 사진 미설정 시 닉네임 첫 글자 대신 사용자별 고유 패턴(public_id 시드)을 보여준다.
  const avatarSeed = profile?.public_id ?? nickname;

  /**
   * 닉네임 사전 중복 확인 (저장과 별개의 API 호출 — race는 저장 시 백엔드가 다시 검증).
   * 본인 현재 닉네임과 같으면 호출 없이 OK 처리(checkNickname은 본인 보유분도 false로 응답하는 보수적 정책).
   */
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
      },
      {
        onSuccess: () => navigate(-1),
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
        <TopBar title={t('mypage2.profile.title')} onBack={() => navigate(-1)} />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className={styles.avatarImg} />
            ) : (
              <Identicon seed={avatarSeed} />
            )}
          </div>
        </div>
        <button type="button" className={styles.secondaryBtn} disabled>
          {t('mypage2.profile.changePhoto')}
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
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
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
