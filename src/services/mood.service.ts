import { apiClient } from './api';
import type { AISearchResult } from '@/types';

interface MoodSearchParams {
  query: string;
  lat?: number;
  lng?: number;
}

export const moodService = {
  async search(params: MoodSearchParams): Promise<AISearchResult> {
    const { data } = await apiClient.post<AISearchResult>('/mood/search', params);
    return data;
  },

  async getVibeReport(period: 'weekly' | 'monthly'): Promise<unknown> {
    const { data } = await apiClient.get(`/mood/report/${period}`);
    return data;
  },
};
