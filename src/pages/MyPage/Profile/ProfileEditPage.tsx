import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { SETTING_LANGUAGES } from '@/constants/languages';
import { useMyProfile } from '@/hooks/useMyProfile';
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

export default function ProfileEditPage() {
  const navigate = useNavigate();
  // 내 프로필 — 폼 초기값을 백엔드에서 가져온다(사이클 1: 조회만, 수정 PATCH는 다음 사이클).
  const { data: profile } = useMyProfile();

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<null | 'ok' | 'fail'>(null);
  const [language, setLanguage] = useState('한국어');
  const [bio, setBio] = useState('');

  // profile 로드 직후 한 번 폼 초기값을 채운다. 그 후엔 사용자 입력에 맡긴다.
  // queryClient 재조회로 profile이 갱신되면 사용자 입력을 덮어쓰므로(요구상 OK — 조회만 단계),
  // PATCH 작업 시엔 더 정교한 dirty 상태 관리 필요.
  useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname);
    setLanguage(LANGUAGE_CODE_TO_LABEL[profile.language] ?? '한국어');
    setBio(profile.bio ?? '');
  }, [profile]);

  const avatarInitial = nickname.charAt(0).toUpperCase() || '?';

  const checkNickname = () => {
    if (!nickname.trim()) return;
    setNicknameStatus('ok');
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="프로필 편집" onBack={() => navigate(-1)} />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{avatarInitial}</div>
        </div>
        <button type="button" className={styles.secondaryBtn}>
          프로필 사진 변경
        </button>

        {/* Nickname */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nickname">
            닉네임
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
              중복확인
            </button>
          </div>
          {nicknameStatus === 'ok' && <p className={styles.fieldOk}>✓ 사용 가능한 닉네임입니다</p>}
          {nicknameStatus === 'fail' && (
            <p className={styles.fieldFail}>✗ 이미 사용 중인 닉네임입니다</p>
          )}
        </div>

        {/* Language */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="language">
            주 사용 언어
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
            자기소개
          </label>
          <textarea
            id="bio"
            className={styles.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate(-1)}>
          저장
        </button>
      </div>
    </>
  );
}
