import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './CommunityWritePage.module.css';

const CATEGORIES = ['거주', '생활', '취업', '자유게시판'] as const;
type Category = (typeof CATEGORIES)[number];

const SUB_CATEGORIES: Record<Category, string[]> = {
  거주: ['룸메 구하기', '집 구하기', '거주 후기'],
  생활: ['생활 꿀팁', '음식/맛집', '문화'],
  취업: ['일자리 정보', '취업 후기', '노무/법률'],
  자유게시판: ['잡담', '질문', '정보 공유'],
};

export default function CommunityWritePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('거주');
  const [subCategory, setSubCategory] = useState<string>(SUB_CATEGORIES['거주'][0]);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [allowAutoTranslate, setAllowAutoTranslate] = useState<boolean>(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Category;
    setCategory(next);
    setSubCategory(SUB_CATEGORIES[next][0]);
  };

  const handleSubmit = () => {
    navigate('/community');
  };

  return (
    <>
      <TopBar title="글쓰기" />

      <div className={styles.field}>
        <label htmlFor="write-category">카테고리</label>
        <select
          id="write-category"
          className={styles.select}
          value={category}
          onChange={handleCategoryChange}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="write-sub-category">세부 카테고리</label>
        <select
          id="write-sub-category"
          className={styles.select}
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
        >
          {SUB_CATEGORIES[category].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
    </>
  );
}
