import { apiClient } from './api';
import type { Place, PlaceDetail, PlaceReview, PaginatedResponse } from '@/types';

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
    return data;
  },

  async search(params: SearchParams): Promise<PaginatedResponse<Place>> {
    const { data } = await apiClient.get<PaginatedResponse<Place>>('/places/search', { params });
    return data;
  },

  async getById(id: string): Promise<PlaceDetail> {
    const { data } = await apiClient.get<PlaceDetail>(`/places/${id}`);
    return data;
  },

  async toggleBookmark(placeId: string): Promise<{ isBookmarked: boolean }> {
    const { data } = await apiClient.post<{ isBookmarked: boolean }>(`/places/${placeId}/bookmark`);
    return data;
  },

  async getBookmarks(): Promise<Place[]> {
    const { data } = await apiClient.get<Place[]>('/users/me/bookmarks');
    return data;
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
