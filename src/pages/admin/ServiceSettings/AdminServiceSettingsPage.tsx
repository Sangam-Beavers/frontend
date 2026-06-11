import { useNavigate } from 'react-router-dom';
import { serviceSettingApi } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AdminServiceSettingsPage.module.css';

// 알려진 설정 키의 메타 정보 — 타입에 따라 UI가 달라진다.
type SettingMeta =
  | { type: 'toggle'; label: string; desc: string }
  | { type: 'number'; label: string; desc: string; unit: string; min?: number; step?: number }
  | { type: 'text'; label: string; desc: string };

const SETTING_META: Record<string, SettingMeta> = {
  MAINTENANCE_MODE: {
    type: 'toggle',
    label: '⚠️ 점검 모드',
    desc: 'true로 켜면 앱 전체 점검 화면 표시',
  },
  MAX_TRANSFER_AMOUNT: {
    type: 'number',
    label: '1회 최대 송금 금액',
    desc: '한 번에 보낼 수 있는 최대 금액',
    unit: 'KRW',
    min: 0,
    step: 10000,
  },
  MIN_TRANSFER_AMOUNT: {
    type: 'number',
    label: '1회 최소 송금 금액',
    desc: '한 번에 보낼 수 있는 최소 금액',
    unit: 'KRW',
    min: 0,
    step: 100,
  },
  MAX_DAILY_TRANSFER: {
    type: 'number',
    label: '1일 최대 송금 총액',
    desc: '하루 동안 보낼 수 있는 총 금액',
    unit: 'KRW',
    min: 0,
    step: 100000,
  },
  DOC_ANALYSIS_CREDIT: {
    type: 'number',
    label: '신규 가입자 서류 분석 크레딧',
    desc: '가입 시 자동으로 지급되는 서류 분석 횟수',
    unit: '장',
    min: 0,
    step: 1,
  },
  EXCHANGE_RATE_REFRESH_MIN: {
    type: 'number',
    label: '환율 자동 갱신 주기',
    desc: '환율 정보를 자동으로 새로고침하는 간격',
    unit: '분',
    min: 1,
    step: 1,
  },
};

interface Setting {
  public_id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  active: boolean;
}

export default function AdminServiceSettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin', 'service-settings'],
    queryFn: () => serviceSettingApi.listAll() as Promise<Setting[]>,
  });

  const updateMut = useMutation({
    mutationFn: ({ publicId, patch }: { publicId: string; patch: Record<string, unknown> }) =>
      serviceSettingApi.update(publicId, patch as Parameters<typeof serviceSettingApi.update>[1]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'service-settings'] }),
  });

  const handleToggle = (s: Setting) => {
    const next = s.setting_value === 'true' ? 'false' : 'true';
    updateMut.mutate({ publicId: s.public_id, patch: { setting_value: next } });
  };

  const handleNumber = (
    s: Setting,
    delta: number,
    meta: Extract<SettingMeta, { type: 'number' }>
  ) => {
    const cur = Number(s.setting_value) || 0;
    const next = Math.max(meta.min ?? 0, cur + delta * (meta.step ?? 1));
    updateMut.mutate({ publicId: s.public_id, patch: { setting_value: String(next) } });
  };

  const handleNumberInput = (s: Setting, value: string) => {
    if (!/^\d*$/.test(value)) return;
    updateMut.mutate({ publicId: s.public_id, patch: { setting_value: value } });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>서비스 설정</span>
        <div style={{ width: 40 }} />
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : (
        <div className={styles.list}>
          {settings.map((s) => {
            const meta = SETTING_META[s.setting_key];

            if (!meta) {
              // 알 수 없는 키 — 원시값 표시
              return (
                <div key={s.public_id} className={styles.card}>
                  <div className={styles.cardLabel}>{s.setting_key}</div>
                  {s.description && <div className={styles.cardDesc}>{s.description}</div>}
                  <div className={styles.rawValue}>{s.setting_value}</div>
                </div>
              );
            }

            return (
              <div
                key={s.public_id}
                className={`${styles.card} ${!s.active ? styles.cardInactive : ''}`}
              >
                <div className={styles.cardLabel}>{meta.label}</div>
                <div className={styles.cardDesc}>{meta.desc}</div>

                {meta.type === 'toggle' && (
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleState}>
                      {s.setting_value === 'true' ? '켜짐' : '꺼짐'}
                    </span>
                    <button
                      type="button"
                      className={`${styles.toggle} ${s.setting_value === 'true' ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => handleToggle(s)}
                      disabled={updateMut.isPending}
                      aria-label="토글"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                )}

                {meta.type === 'number' && (
                  <div className={styles.numberRow}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleNumber(s, -1, meta)}
                      disabled={updateMut.isPending}
                    >
                      −
                    </button>
                    <input
                      className={styles.numberInput}
                      value={s.setting_value}
                      onChange={(e) => handleNumberInput(s, e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateMut.mutate({
                            publicId: s.public_id,
                            patch: { setting_value: '0' },
                          });
                        }
                      }}
                    />
                    <span className={styles.unit}>{meta.unit}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleNumber(s, 1, meta)}
                      disabled={updateMut.isPending}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
