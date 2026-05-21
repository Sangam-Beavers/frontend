import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { SETTING_LANGUAGES } from '@/constants/languages';
import styles from './ProfileEditPage.module.css';

const LANGUAGES = SETTING_LANGUAGES;

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('global_neighbor');
  const [language, setLanguage] = useState('한국어');
  const [bio, setBio] = useState('안녕하세요.');

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="프로필 편집" onBack={() => navigate(-1)} />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>G</div>
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
              onChange={(e) => setNickname(e.target.value)}
            />
            <button type="button" className={styles.inlineBtn}>
              중복확인
            </button>
          </div>
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
