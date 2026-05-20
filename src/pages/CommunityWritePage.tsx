import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import styles from './CommunityWritePage.module.css';

export default function CommunityWritePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('거주 / 생활 / 취업 / 자유게시판');
  const [subCategory, setSubCategory] = useState<string>('룸메 구하기');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [allowAutoTranslate, setAllowAutoTranslate] = useState<boolean>(false);

  const handleSubmit = () => {
    navigate('/community');
  };

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={2} />}>
      <TopBar title="글쓰기" />

      <div className={styles.field}>
        <label htmlFor="write-category">카테고리</label>
        <button
          id="write-category"
          type="button"
          className={styles.select}
          onClick={() => setCategory(category)}
        >
          <span>{category}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="write-sub-category">세부 카테고리</label>
        <button
          id="write-sub-category"
          type="button"
          className={styles.select}
          onClick={() => setSubCategory(subCategory)}
        >
          <span>{subCategory}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="write-title">제목</label>
        <input
          id="write-title"
          type="text"
          className={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="write-body">본문</label>
        <textarea
          id="write-body"
          className={styles.textarea}
          placeholder="내용을 입력하세요"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <button type="button" className={styles.secondary}>
        이미지 첨부
      </button>

      <div className={styles.toggleRow}>
        <span>자동 번역 허용</span>
        <button
          type="button"
          aria-pressed={allowAutoTranslate}
          aria-label="자동 번역 허용"
          className={`${styles.checkbox} ${allowAutoTranslate ? styles.checkboxChecked : ''}`}
          onClick={() => setAllowAutoTranslate((prev) => !prev)}
        >
          {allowAutoTranslate ? '✓' : ''}
        </button>
      </div>

      <div className={styles.primaryFixed}>
        <button type="button" className={styles.primary} onClick={handleSubmit}>
          작성 완료
        </button>
      </div>
    </MobileScreen>
  );
}
