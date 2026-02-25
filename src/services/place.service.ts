import { apiClient } from './api';
import type { Place, PlaceDetail, PlaceReview, PaginatedResponse } from '@/types';

// 백엔드 응답 → Place 타입 정규화 (tags: 객체배열 → 문자열배열, images → imageUrl)
function normalizePlace(raw: any): Place {
  return {
    ...raw,
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t: any) => (typeof t === 'string' ? t : t.tag ?? '')).filter(Boolean)
      : [],
    imageUrl: raw.imageUrl ?? raw.images?.find((img: any) => img.isPrimary)?.url ?? raw.images?.[0]?.url,
  };
}

interface ReviewsResponse {
  reviews: PlaceReview[];
  total: number;
  page: number;
  hasNext: boolean;
}

interface NearbyParams {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
}

interface SearchParams {
  query: string;
  lat?: number;
  lng?: number;
  sortBy?: 'distance' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export const placeService = {
  async getNearby(params: NearbyParams): Promise<PaginatedResponse<Place>> {
    const { data } = await apiClient.get<PaginatedResponse<Place>>('/places/nearby', { params });
    return { ...data, data: data.data.map(normalizePlace) };
  },

  async search(params: SearchParams): Promise<PaginatedResponse<Place>> {
    const { data } = await apiClient.get<PaginatedResponse<Place>>('/places/search', { params });
    return { ...data, data: data.data.map(normalizePlace) };
  },

  async getById(id: string, hint?: { name: string; lat: number; lng: number }): Promise<PlaceDetail> {
    const params = hint ? { name: hint.name, lat: hint.lat, lng: hint.lng } : undefined;
    const { data } = await apiClient.get<PlaceDetail>(`/places/${id}`, { params });
    return normalizePlace(data) as PlaceDetail;
  },

  async toggleBookmark(placeId: string, imageUrl?: string): Promise<{ isBookmarked: boolean }> {
    const { data } = await apiClient.post<{ isBookmarked: boolean }>(`/places/${placeId}/bookmark`, { imageUrl });
    return data;
  },

  async getBookmarks(): Promise<Place[]> {
    const { data } = await apiClient.get<Place[]>('/places/bookmarks');
    const result = (data as any[]).map(normalizePlace);
    console.log('[Bookmarks] raw[0]:', JSON.stringify((data as any[])[0]));
    console.log('[Bookmarks] normalized[0]:', JSON.stringify(result[0]));
    return result;
  },

  async checkIn(placeId: string, mood: string, note?: string, imageUrl?: string): Promise<void> {
    await apiClient.post(`/places/${placeId}/checkin`, { mood, note, imageUrl });
  },

  async getReviews(placeId: string, page = 1, limit = 20): Promise<ReviewsResponse> {
    const { data } = await apiClient.get<ReviewsResponse>(`/places/${placeId}/reviews`, {
      params: { page, limit },
    });
    return data;
  },

  async addReview(placeId: string, rating: number, body: string): Promise<void> {
    await apiClient.post(`/places/${placeId}/reviews`, { rating, body });
  },
};
