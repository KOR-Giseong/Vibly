import { apiClient } from './api';

export type CreditTxType =
  | 'SIGNUP_BONUS'
  | 'MOOD_SEARCH_BASIC'
  | 'MOOD_SEARCH_AI'
  | 'CHECKIN_GPS'
  | 'CHECKIN_RECEIPT'
  | 'AD_WATCH'
  | 'ADMIN_GRANT';

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;        // 양수=획득, 음수=소모
  type: CreditTxType;
  referenceId?: string;
  createdAt: string;
}

export interface CreditBalance {
  credits: number;
  isPremium: boolean;
}

export interface WatchAdResult {
  credits: number;
  earned: number;
  adWatchesToday: number;
}

export const TX_TYPE_LABEL: Record<CreditTxType, string> = {
  SIGNUP_BONUS:      '가입 보너스',
  MOOD_SEARCH_BASIC: '감정 검색',
  MOOD_SEARCH_AI:    'AI 분석 검색',
  CHECKIN_GPS:       'GPS 체크인 보상',
  CHECKIN_RECEIPT:   '영수증 체크인 보상',
  AD_WATCH:          '광고 시청 보상',
  ADMIN_GRANT:       '관리자 지급',
};

export const creditService = {
  getBalance: async (): Promise<CreditBalance> => {
    const { data } = await apiClient.get<CreditBalance>('/credits/balance');
    return data;
  },

  watchAd: async (): Promise<WatchAdResult> => {
    const { data } = await apiClient.post<WatchAdResult>('/credits/watch-ad');
    return data;
  },

  getAdWatchesToday: async (): Promise<{ adWatchesToday: number; maxAdWatches: number }> => {
    const { data } = await apiClient.get('/credits/ad-watches-today');
    return data;
  },

  getHistory: async (page = 1): Promise<{
    items: CreditTransaction[];
    total: number;
    page: number;
    hasNext: boolean;
  }> => {
    const { data } = await apiClient.get('/credits/history', { params: { page, limit: 20 } });
    return data;
  },
};
