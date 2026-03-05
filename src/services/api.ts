import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@utils/storage';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 70000, // Render free tier 깨우는 데 최대 60초 → 70초로 여유 확보
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: Access Token 자동 주입 ────────────────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: 401 토큰 갱신 / 503 콜드 스타트 재시도 ──────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retry503?: boolean };

    // 503: Render 콜드 스타트 등 일시적 서버 불가 → 5초 대기 후 1회 자동 재시도
    if (error.response?.status === 503 && !original._retry503) {
      original._retry503 = true;
      await new Promise((res) => setTimeout(res, 5000));
      return apiClient(original);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no_refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await storage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
      }
    }

    // 계정 정지 → 즉시 정지 화면으로 이동
    const responseData = error.response?.data as any;
    if (error.response?.status === 403 && responseData?.code === 'ACCOUNT_SUSPENDED') {
      router.replace('/suspended');
    }

    return Promise.reject(error);
  },
);
