import { apiClient } from './api';
import type {
  CoupleInfo,
  CoupleInvitation,
  DatePlan,
  DatePlanStatus,
  CoupleMemory,
  CoupleMessage,
  CoupleCreditHistory,
  PartnerProfile,
  Place,
} from '@types';

// 백엔드가 localhost URL을 반환할 경우 실제 서버 IP로 교체
function fixMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '');
  // 상대경로 (/public/...) → 서버 IP 붙이기
  if (url.startsWith('/')) return `${base}${url}`;
  // localhost URL → 서버 IP로 교체
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return `${base}${u.pathname}`;
    }
  } catch { /* 무시 */ }
  return url;
}

export interface SendInvitationDto {
  receiverId: string;
  message?: string;
}

export interface CreateDatePlanDto {
  title: string;
  dateAt: string;
  memo?: string;
  placeIds?: string[];
}

export interface UpdateDatePlanDto {
  title?: string;
  dateAt?: string;
  memo?: string;
  status?: DatePlanStatus;
  placeIds?: string[];
}

export interface UploadMemoryDto {
  imageBase64: string;
  caption?: string;
  takenAt?: string;
}

export interface AiDateTimelineItem {
  time: string;
  emoji: string;
  place: string;
  activity: string;
  tip: string;
}

export interface AiDateAnalysisResult {
  analysis: string;
  creditsRemaining: number;
  timeline?: AiDateTimelineItem[];
}

export interface UserSearchResult {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
}

export const coupleService = {
  /** 내 커플 정보 */
  getMyCouple: async (): Promise<CoupleInfo | null> => {
    const { data } = await apiClient.get<CoupleInfo | null>('/couple/me');
    return data;
  },

  /** 초대할 유저 검색 (이메일/닉네임) */
  searchUser: async (query: string): Promise<UserSearchResult[]> => {
    const { data } = await apiClient.get<UserSearchResult[]>('/couple/search', {
      params: { q: query },
    });
    return data;
  },

  /** 초대 전송 */
  sendInvitation: async (dto: SendInvitationDto): Promise<CoupleInvitation> => {
    const { data } = await apiClient.post<CoupleInvitation>('/couple/invite', dto);
    return data;
  },

  /** 받은 초대 목록 */
  getReceivedInvitations: async (): Promise<CoupleInvitation[]> => {
    const { data } = await apiClient.get<CoupleInvitation[]>('/couple/invitations/received');
    return data;
  },

  /** 보낸 초대 목록 */
  getSentInvitations: async (): Promise<CoupleInvitation[]> => {
    const { data } = await apiClient.get<CoupleInvitation[]>('/couple/invitations/sent');
    return data;
  },

  /** 초대 수락/거절 */
  respondToInvitation: async (
    id: string,
    accept: boolean
  ): Promise<{ message: string; couple?: CoupleInfo }> => {
    const { data } = await apiClient.post(`/couple/invitations/${id}/respond`, { accept });
    return data;
  },

  /** 초대 취소 */
  cancelInvitation: async (id: string): Promise<void> => {
    await apiClient.delete(`/couple/invitations/${id}`);
  },

  /** 커플 해제 */
  dissolveCouple: async (): Promise<void> => {
    await apiClient.delete('/couple/dissolve');
  },

  /** 크레딧 공유 토글 */
  toggleCreditShare: async (enabled: boolean): Promise<CoupleInfo> => {
    const { data } = await apiClient.patch<CoupleInfo>('/couple/credit-share', { enabled });
    return data;
  },

  /** 파트너에게 크레딧 전송 */
  transferCredits: async (amount: number): Promise<{ creditsRemaining: number }> => {
    const { data } = await apiClient.post<{ creditsRemaining: number }>(
      '/couple/transfer-credits',
      { amount }
    );
    return data;
  },

  /** 커플 크레딧 선물 내역 */
  getCreditHistory: async (): Promise<CoupleCreditHistory[]> => {
    const { data } = await apiClient.get<CoupleCreditHistory[]>('/couple/credit-history');
    return data;
  },

  /** 파트너 스크랩 목록 */
  getPartnerBookmarks: async (): Promise<Place[]> => {
    const { data } = await apiClient.get<Place[]>('/couple/partner/bookmarks');
    return data;
  },

  /** 파트너 프로필 */
  getPartnerProfile: async (): Promise<PartnerProfile> => {
    const { data } = await apiClient.get<PartnerProfile>('/couple/partner/profile');
    return data;
  },

  /** 기념일 설정 */
  setAnniversaryDate: async (date: string): Promise<CoupleInfo> => {
    const { data } = await apiClient.patch<CoupleInfo>('/couple/anniversary', { date });
    return data;
  },

  // ─── Date Plans ───────────────────────────────────────────────────────────

  getDatePlans: async (): Promise<DatePlan[]> => {
    const { data } = await apiClient.get<DatePlan[]>('/couple/date-plans');
    return data;
  },

  createDatePlan: async (dto: CreateDatePlanDto): Promise<DatePlan> => {
    const { data } = await apiClient.post<DatePlan>('/couple/date-plans', dto);
    return data;
  },

  updateDatePlan: async (id: string, dto: UpdateDatePlanDto): Promise<DatePlan> => {
    const { data } = await apiClient.patch<DatePlan>(`/couple/date-plans/${id}`, dto);
    return data;
  },

  deleteDatePlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/couple/date-plans/${id}`);
  },

  aiDateAnalysis: async (): Promise<AiDateAnalysisResult> => {
    const { data } = await apiClient.post<AiDateAnalysisResult>(
      '/couple/date-plans/ai-analysis'
    );
    return data;
  },

  // ─── Memories ─────────────────────────────────────────────────────────────

  getMemories: async (page = 1, limit = 24): Promise<{
    items: CoupleMemory[];
    total: number;
    page: number;
    hasNext: boolean;
  }> => {
    const { data } = await apiClient.get('/couple/memories', { params: { page, limit } });
    return {
      ...data,
      items: (data.items ?? []).map((m: CoupleMemory) => ({
        ...m,
        imageUrl: fixMediaUrl(m.imageUrl) ?? m.imageUrl,
      })),
    };
  },

  uploadMemory: async (dto: UploadMemoryDto): Promise<CoupleMemory> => {
    const { data } = await apiClient.post<CoupleMemory>('/couple/memories', dto);
    return data;
  },

  deleteMemory: async (id: string): Promise<void> => {
    await apiClient.delete(`/couple/memories/${id}`);
  },

  reportUser: async (dto: { reportedId: string; reason: string; detail?: string }): Promise<void> => {
    await apiClient.post('/couple/report', dto);
  },

  // ─── Chat ─────────────────────────────────────────────────────────────────

  getMessages: async (page = 1, limit = 50): Promise<{
    items: CoupleMessage[];
    total: number;
    page: number;
    hasNext: boolean;
  }> => {
    const { data } = await apiClient.get('/couple/messages', { params: { page, limit } });
    return {
      ...data,
      items: (data.items ?? []).map((m: CoupleMessage) => ({
        ...m,
        imageUrl: fixMediaUrl(m.imageUrl),
      })),
    };
  },

  sendMessage: async (dto: {
    type: 'TEXT' | 'IMAGE' | 'EMOJI';
    text?: string;
    imageBase64?: string;
    emoji?: string;
  }): Promise<CoupleMessage> => {
    const { data } = await apiClient.post<CoupleMessage>('/couple/messages', dto);
    return { ...data, imageUrl: fixMediaUrl(data.imageUrl) };
  },

  markMessagesRead: async (): Promise<void> => {
    await apiClient.patch('/couple/messages/read');
  },
};
