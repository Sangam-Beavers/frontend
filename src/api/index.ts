/**
 * API 모듈 진입점. 호출 측은 `import { communityApi } from '@/api'`로 사용.
 *
 * client.ts는 axios 인스턴스·interceptor·ApiException 정의. 도메인별 함수는 *.ts.
 */

export { apiClient, ApiException } from './client';
export type { ApiSuccess, ApiError } from './client';

export { communityApi } from './community';
export { memberApi } from './member';
export { walletApi } from './wallet';
export { documentApi } from './document';
