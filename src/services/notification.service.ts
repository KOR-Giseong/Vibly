import { apiClient } from './api';
import type { AppNotification, NotificationType } from '@/types';

// ─── 응답 타입 ────────────────────────────────────────────────────────────────

export interface NotificationListResponse {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  hasNext: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const notificationApi = {
  /** 디바이스 푸시 토큰 등록/갱신 */
  registerToken: (pushToken: string, platform: 'ios' | 'android') =>
    apiClient
      .post<void>('/notifications/register-token', { pushToken, platform })
      .then((r) => r.data),

  /** 알림 목록 (최신순, 페이지네이션) */
  getList: (page = 1, limit = 30) =>
    apiClient
      .get<NotificationListResponse>('/notifications', { params: { page, limit } })
      .then((r) => r.data),

  /** 읽지 않은 알림 수 */
  getUnreadCount: () =>
    apiClient
      .get<UnreadCountResponse>('/notifications/unread-count')
      .then((r) => r.data.count),

  /** 단건 읽음 처리 */
  markRead: (id: string) =>
    apiClient.patch<void>(`/notifications/${id}/read`).then((r) => r.data),

  /** 전체 읽음 처리 */
  markAllRead: () =>
    apiClient.patch<void>('/notifications/read-all').then((r) => r.data),

  /** 단건 삭제 */
  deleteOne: (id: string) =>
    apiClient.delete<void>(`/notifications/${id}`).then((r) => r.data),

  /** 디바이스 토큰 삭제 (로그아웃 시) */
  removeToken: (pushToken?: string) =>
    apiClient
      .delete<void>('/notifications/register-token', {
        params: pushToken ? { pushToken } : undefined,
      })
      .then((r) => r.data),
};

// ─── 알림 타입별 표시 정보 ────────────────────────────────────────────────────

export interface NotifDisplayInfo {
  label: string;
  gradient: [string, string];
}

export const NOTIF_DISPLAY: Record<string, NotifDisplayInfo> = {
  RECOMMEND:     { label: 'AI 추천',    gradient: ['#7C3AED', '#DB2777'] },
  LIKE:          { label: '좋아요',      gradient: ['#EF4444', '#F97316'] },
  NEARBY:        { label: '주변 장소',   gradient: ['#2563EB', '#7C3AED'] },
  PROMO:         { label: '혜택',        gradient: ['#F59E0B', '#EF4444'] },
  REPORT:        { label: '리포트',      gradient: ['#10B981', '#2563EB'] },
  COUPLE_INVITE: { label: '커플 초대',   gradient: ['#EC4899', '#F97316'] },
  COUPLE_ACCEPT: { label: '커플 수락',   gradient: ['#10B981', '#06B6D4'] },
  COMMENT:       { label: '댓글',        gradient: ['#3B82F6', '#8B5CF6'] },
  CREDIT:        { label: '크레딧',      gradient: ['#F59E0B', '#10B981'] },
  SUPPORT:       { label: '지원 답변',   gradient: ['#64748B', '#3B82F6'] },
};

export type NotifIconKey =
  | 'sparkles'
  | 'heart'
  | 'map-pin'
  | 'gift'
  | 'heart-handshake'
  | 'users'
  | 'message-circle'
  | 'coins'
  | 'headphones';

export const NOTIF_ICON: Record<string, NotifIconKey> = {
  RECOMMEND:     'sparkles',
  LIKE:          'heart',
  NEARBY:        'map-pin',
  PROMO:         'gift',
  REPORT:        'sparkles',
  COUPLE_INVITE: 'users',
  COUPLE_ACCEPT: 'heart-handshake',
  COMMENT:       'message-circle',
  CREDIT:        'coins',
  SUPPORT:       'headphones',
};
