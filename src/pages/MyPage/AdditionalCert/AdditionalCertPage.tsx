import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { verificationApi, type IdentityDocumentTypeCode } from '@/api/member';
import { walletApi } from '@/api/wallet';
import { ApiException } from '@/api/client';
import styles from './AdditionalCertPage.module.css';

/**
 * 추가 인증(신분증 인증) 화면. 이슈 #108 / 백엔드 #152.
 *
 * <p>OCR 미도입 단계 — 사용자가 신분증 번호를 직접 입력해 인증한다. 형식 검증 통과 시 백엔드가
 * 즉시 APPROVED + 인증 배지 + 전자지갑 자동 개설을 처리한다.
 *
 * <p>이슈 #108로 신분증 종류 정리:
 * <ul>
 *   <li>외국인 등록증 — 한국 거주 외국인 노동자(앱 주 사용자, 송금자)</li>
 *   <li>본국 신분증(한국/미국/베트남/필리핀) — 본국 거주 가족(INTERNAL_TRANSFER 수령자)</li>
 * </ul>
 * 여권은 외국인등록증/본국 신분증 두 분류로 사용자가 대부분 커버되므로 제거.
 */

/** 본국 신분증 국가 코드(2단계 선택 시 사용). */
type NationalCountryCode = 'KR' | 'US' | 'VN' | 'PH';

/**
 * 신분증 번호 자동 포맷터(타입별).
 *
 * <p>사용자가 숫자/영문만 입력해도 표준 표기(예: `YYMMDD-Sxxxxxx`, `XXX-XX-XXXX`)로 자동 변환된다.
 * 정규식 검증·서버 전송도 포맷된 값을 그대로 사용 — UI 입력과 서버 데이터의 표기가 항상 일치한다.
 */

/** YYMMDD-Sxxxxxx (외국인등록증·한국 RRN 공통). 숫자만 13자리, 6자리 후 자동 하이픈. */
function formatRrnLike(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

/** XXX-XX-XXXX (미국 SSN). 숫자만 9자리, 3·5자리 후 자동 하이픈. */
function formatSsn(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** 베트남 CCCD — 숫자만 12자(하이픈 없음). */
function formatDigitsOnly12(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

/** 필리핀 PhilSys PCN — 대문자 영숫자 16자(하이픈 없음). */
function formatPhilSys(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);
}

interface NationalIdMeta {
  code: NationalCountryCode;
  /** 백엔드 IdentityDocumentType enum 코드로 매핑 — 요청 body에 그대로. */
  serverCode: IdentityDocumentTypeCode;
  flag: string;
  titleKey: string;
  placeholderKey: string;
  pattern: RegExp;
  formatHintKey: string;
  /** 자동 포맷 함수(타입별). */
  format: (raw: string) => string;
  /** input maxLength — 포맷된 값 기준 자릿수. */
  maxLength: number;
}

const NATIONAL_IDS: NationalIdMeta[] = [
  {
    code: 'KR',
    serverCode: 'NATIONAL_ID_KR',
    flag: '🇰🇷',
    titleKey: 'mypage2.cert.national.KR.title',
    placeholderKey: 'mypage2.cert.national.KR.placeholder',
    // BE: ^\d{6}-[0-49]\d{6}$ (한국 시민 — 7번째 자리 0~4 또는 9)
    pattern: /^\d{6}-[0-49]\d{6}$/,
    formatHintKey: 'mypage2.cert.national.KR.formatHint',
    format: formatRrnLike,
    maxLength: 14,
  },
  {
    code: 'US',
    serverCode: 'NATIONAL_ID_US',
    flag: '🇺🇸',
    titleKey: 'mypage2.cert.national.US.title',
    placeholderKey: 'mypage2.cert.national.US.placeholder',
    // BE strict: 첫 3자리 000/666/9xx 금지, 중간 00 금지, 끝 0000 금지.
    pattern: /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/,
    formatHintKey: 'mypage2.cert.national.US.formatHint',
    format: formatSsn,
    maxLength: 11,
  },
  {
    code: 'VN',
    serverCode: 'NATIONAL_ID_VN',
    flag: '🇻🇳',
    titleKey: 'mypage2.cert.national.VN.title',
    placeholderKey: 'mypage2.cert.national.VN.placeholder',
    // BE: ^\d{12}$
    pattern: /^\d{12}$/,
    formatHintKey: 'mypage2.cert.national.VN.formatHint',
    format: formatDigitsOnly12,
    maxLength: 12,
  },
  {
    code: 'PH',
    serverCode: 'NATIONAL_ID_PH',
    flag: '🇵🇭',
    titleKey: 'mypage2.cert.national.PH.title',
    placeholderKey: 'mypage2.cert.national.PH.placeholder',
    // BE: ^[A-Z0-9]{16}$ (대문자 정규화 후 매칭)
    pattern: /^[A-Z0-9]{16}$/,
    formatHintKey: 'mypage2.cert.national.PH.formatHint',
    format: formatPhilSys,
    maxLength: 16,
  },
];

/** 외국인 등록증(고정 1종). */
const ALIEN_META = {
  serverCode: 'ALIEN_REGISTRATION' as IdentityDocumentTypeCode,
  titleKey: 'mypage2.cert.alien.title',
  placeholderKey: 'mypage2.cert.alien.placeholder',
  // BE: ^\d{6}-[5-8]\d{6}$ (외국인등록번호 — 뒤 첫자리 5~8)
  pattern: /^\d{6}-[5-8]\d{6}$/,
  formatHintKey: 'mypage2.cert.alien.formatHint',
  format: formatRrnLike,
  maxLength: 14,
};

/** 1단계 신분증 분류 — 외국인등록증 vs 본국 신분증. */
type IdKind = 'ALIEN' | 'NATIONAL';

export default function AdditionalCertPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 인증 직후 ['member','me'] 캐시를 강제 refetch — 안 그러면 useMyProfile staleTime(5분) 때문에
  // VerifiedRoute가 is_verified=false 캐시를 그대로 읽어 PIN 설정 페이지(금융 라우트)로 못 들어간다.
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<IdKind | null>(null);
  const [nationalCode, setNationalCode] = useState<NationalCountryCode | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 선택된 신분증 메타(외국인 등록증 OR 선택된 국가의 본국 신분증).
  const selectedMeta = useMemo(() => {
    if (kind === 'ALIEN') return ALIEN_META;
    if (kind === 'NATIONAL' && nationalCode) {
      return NATIONAL_IDS.find((m) => m.code === nationalCode) ?? null;
    }
    return null;
  }, [kind, nationalCode]);

  /**
   * 클라이언트 1차 정규식 검증(UX). 서버가 최종 검증(SSOT).
   * 입력은 onChange에서 이미 format으로 정규화돼 들어오므로 그대로 매칭.
   */
  const isFormatValid = useMemo(() => {
    if (!selectedMeta) return false;
    return selectedMeta.pattern.test(documentNumber);
  }, [selectedMeta, documentNumber]);

  /** 1단계 분류 변경 — 하위 상태 초기화. */
  const selectKind = (next: IdKind) => {
    setKind(next);
    setNationalCode(null);
    setDocumentNumber('');
    setErrorMsg(null);
  };

  const selectNational = (next: NationalCountryCode) => {
    setNationalCode(next);
    setDocumentNumber('');
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    if (!selectedMeta) return;
    setErrorMsg(null);

    if (!isFormatValid) {
      setErrorMsg(t(selectedMeta.formatHintKey));
      return;
    }

    setSubmitting(true);
    try {
      // 입력은 이미 format으로 정규화돼 documentNumber에 들어있다 — 그대로 전송한다.
      // 서버도 IdentityDocumentType#normalize로 동일 정규화 후 검증·저장(예: 필리핀 PCN 대문자).
      await verificationApi.submit({
        identity_document_type: selectedMeta.serverCode,
        document_number: documentNumber,
      });

      // 안전망: BE는 인증 APPROVED 시 wallet-service에 지갑 개설을 위임하지만 dev 프로파일에서는
      // MockWalletClient가 실제 호출을 건너뛴다(no-op). 프론트에서도 멱등 createWallet을 한 번
      // 호출해 사용자 환경(wallet-service 동시 기동)에서 지갑이 확실히 생기게 한다. 이미 있으면
      // 백엔드가 기존 지갑을 그대로 반환하므로 두 번 호출돼도 안전. 실패는 fail-open으로 흡수.
      try {
        await walletApi.createWallet();
      } catch (walletErr) {
        // 인증은 이미 commit됐으니 막지 않는다 — 다음 흐름(PIN 설정 등)에서 보정.
        console.warn('[verification] 지갑 자동 개설 안전망 호출 실패', walletErr);
      }

      // 인증 성공 → is_verified=true가 즉시 반영되도록 프로필 캐시를 refetch한 뒤 이동한다.
      // (VerifiedRoute가 그 다음 라우트들에서 캐시된 false를 보지 않게 하기 위함)
      await queryClient.refetchQueries({ queryKey: ['member', 'me'] });
      navigate(ROUTES.MYPAGE_BADGE_COMPLETE);
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'COMMON4001') {
          setErrorMsg(t(selectedMeta.formatHintKey));
        } else if (e.code === 'COMMON4091') {
          setErrorMsg(t('mypage2.cert.errors.alreadyInProgress'));
        } else {
          setErrorMsg(e.message || t('mypage2.cert.errors.requestFailed'));
        }
      } else {
        setErrorMsg(t('mypage2.cert.errors.requestFailedRetry'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('mypage2.cert.title')} onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>{t('mypage2.cert.infoTitle')}</div>
          <div className={styles.cardText}>{t('mypage2.cert.infoText')}</div>
        </div>

        {/* 1단계: 신분증 분류 */}
        <div className={styles.list}>
          <div
            className={`${styles.item} ${kind === 'ALIEN' ? styles.itemSelected : ''}`}
            onClick={() => selectKind('ALIEN')}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{t('mypage2.cert.kind.alien.title')}</div>
              <div className={styles.itemMeta}>{t('mypage2.cert.kind.alien.meta')}</div>
            </div>
            <span className={`${styles.chevron} ${kind === 'ALIEN' ? styles.chevronActive : ''}`}>
              ›
            </span>
          </div>
          <div
            className={`${styles.item} ${kind === 'NATIONAL' ? styles.itemSelected : ''}`}
            onClick={() => selectKind('NATIONAL')}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{t('mypage2.cert.kind.national.title')}</div>
              <div className={styles.itemMeta}>{t('mypage2.cert.kind.national.meta')}</div>
            </div>
            <span
              className={`${styles.chevron} ${kind === 'NATIONAL' ? styles.chevronActive : ''}`}
            >
              ›
            </span>
          </div>
        </div>

        {/* 2단계: 본국 신분증 선택 시 국가 라디오 */}
        {kind === 'NATIONAL' && (
          <div className={styles.countryRow}>
            {NATIONAL_IDS.map((m) => (
              <button
                key={m.code}
                type="button"
                className={`${styles.countryChip} ${nationalCode === m.code ? styles.countryChipActive : ''}`}
                onClick={() => selectNational(m.code)}
              >
                <span className={styles.countryFlag}>{m.flag}</span>
                <span className={styles.countryLabel}>
                  {t(`mypage2.cert.countryLabel.${m.code}`)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 3단계: 번호 입력 */}
        {selectedMeta && (
          <div className={styles.inputBlock}>
            <label className={styles.inputLabel} htmlFor="documentNumber">
              {t('mypage2.cert.numberLabel', { title: t(selectedMeta.titleKey) })}
            </label>
            <input
              id="documentNumber"
              type="text"
              className={styles.input}
              placeholder={t(selectedMeta.placeholderKey)}
              value={documentNumber}
              onChange={(e) => {
                // 자동 포맷팅: 사용자가 숫자/영문만 입력해도 표준 표기(하이픈 등)로 변환된다.
                setDocumentNumber(selectedMeta.format(e.target.value));
                setErrorMsg(null);
              }}
              // SSN 등 숫자 위주는 숫자 키패드를 띄워 모바일 입력을 돕는다.
              // 필리핀 PCN은 영숫자 모두 필요해 일반 text.
              inputMode={selectedMeta.serverCode === 'NATIONAL_ID_PH' ? 'text' : 'numeric'}
              autoComplete="off"
              spellCheck={false}
              maxLength={selectedMeta.maxLength}
            />
            <p className={styles.inputHint}>{t(selectedMeta.formatHintKey)}</p>
            {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!selectedMeta || !isFormatValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? t('mypage2.cert.submitting') : t('mypage2.cert.submit')}
        </button>
      </div>
    </>
  );
}
