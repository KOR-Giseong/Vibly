import { apiClient } from './api';
import type { Place, PlaceDetail, PlaceReview, PaginatedResponse, ReviewSummary, SmartRecommendResult } from '@/types';

export interface MyCheckIn {
  id: string;
  placeId: string;
  placeName: string;
  category: string;
  address: string;
  imageUrl: string;
  mood: string;
  note?: string | null;
  imageUrl_checkin?: string | null;
  createdAt: string;
}

export interface MyReview {
  id: string;
  placeId: string;
  placeName: string;
  category: string;
  address: string;
  imageUrl: string;
  rating: number;
  body: string;
  createdAt: string;
}

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

export interface PlaceContext {
  mood?: string;          // 무드 검색에서 진입 시
  vibes?: string[];       // 홈/북마크에서 진입 시 (선호 바이브)
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

  async getById(id: string, hint?: { name: string; lat: number; lng: number }, context?: PlaceContext): Promise<PlaceDetail> {
    const params: Record<string, string> = {};
    if (hint) {
      params.name = hint.name;
      params.lat  = String(hint.lat);
      params.lng  = String(hint.lng);
    }
    if (context?.mood) {
      params.mood = context.mood;
    } else if (context?.vibes && context.vibes.length > 0) {
      params.vibes = context.vibes.join(',');
    }
    const { data } = await apiClient.get<PlaceDetail>(`/places/${id}`, { params: Object.keys(params).length ? params : undefined });
    return normalizePlace(data) as PlaceDetail;
  },

  async toggleBookmark(placeId: string, imageUrl?: string): Promise<{ isBookmarked: boolean }> {
    const { data } = await apiClient.post<{ isBookmarked: boolean }>(`/places/${placeId}/bookmark`, { imageUrl });
    return data;
  },

  async getBookmarks(): Promise<Place[]> {
    const { data } = await apiClient.get<Place[]>('/places/bookmarks');
    const result = (data as any[]).map(normalizePlace);
    return result;
  },

  async checkIn(
    placeId: string,
    mood: string,
    receiptUri: string | null,
    note?: string,
    location?: { lat: number; lng: number },
  ): Promise<void> {
    const formData = new FormData();
    formData.append('mood', mood);
    if (note) formData.append('note', note);

    if (receiptUri) {
      // 영수증 OCR 방식
      formData.append('receipt', {
        uri: receiptUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as unknown as Blob);
    } else if (location) {
      // GPS 방식 (영수증 없는 경우)
      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
    }

    await apiClient.post(`/places/${placeId}/checkin`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getMyCheckins(): Promise<MyCheckIn[]> {
    const { data } = await apiClient.get<MyCheckIn[]>('/places/my-checkins');
    return data;
  },

  async getMyReviews(): Promise<MyReview[]> {
    const { data } = await apiClient.get<MyReview[]>('/places/my-reviews');
    return data;
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

  async likeReview(placeId: string, reviewId: string): Promise<{ likesCount: number }> {
    const { data } = await apiClient.post<{ likesCount: number }>(
      `/places/${placeId}/reviews/${reviewId}/like`,
    );
    return data;
  },

  async unlikeReview(placeId: string, reviewId: string): Promise<{ likesCount: number }> {
    const { data } = await apiClient.delete<{ likesCount: number }>(
      `/places/${placeId}/reviews/${reviewId}/like`,
    );
    return data;
  },

  async getReviewSummary(placeId: string): Promise<ReviewSummary> {
    const { data } = await apiClient.get<ReviewSummary>(`/places/${placeId}/review-summary`);
    return data;
  },

  async smartRecommend(lat: number, lng: number, mode: 'nearby' | 'wide' = 'nearby'): Promise<SmartRecommendResult> {
    const { data } = await apiClient.post<SmartRecommendResult>('/places/smart-recommend', { lat, lng, mode });
    return data;
  },
};
