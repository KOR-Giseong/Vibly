import { apiClient } from './api';
import type { AISearchResult, VibeReportResponse } from '@/types';

interface MoodSearchParams {
  query: string;
  lat?: number;
  lng?: number;
  limit?: number;
  radius?: number;
  regionLabel?: string;
}

export const moodService = {
  async search(params: MoodSearchParams): Promise<AISearchResult> {
    const { data } = await apiClient.post<AISearchResult>('/mood/search', params);
    return data;
  },

  async getVibeReport(period: 'weekly' | 'monthly'): Promise<VibeReportResponse> {
    const { data } = await apiClient.get<VibeReportResponse>('/mood/vibe-report', {
      params: { period },
    });
    return data;
  },
};
