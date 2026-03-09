import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@utils/storage';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 70000,
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

    // 502/503: Render 재시작 중 일시적 서버 불가 → 최대 2회 재시도 (각 10초 대기)
    const isServerDown = error.response?.status === 502 || error.response?.status === 503 || !error.response;
    const retryCount = (original as any)._retryCount ?? 0;
    if (isServerDown && retryCount < 2 && !original._retry) {
      (original as any)._retryCount = retryCount + 1;
      await new Promise((res) => setTimeout(res, 10000));
      return apiClient(original);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no_refresh_token');

        // Render 슬립 상태일 수 있으므로 503이면 최대 2회 재시도 (각 5초 대기)
        let data: { accessToken: string; refreshToken?: string } | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 70000 });
            data = res.data;
            break;
          } catch (retryErr: any) {
            const status = retryErr?.response?.status;
            if ((status === 502 || status === 503 || !status) && attempt < 2) {
              // 서버 슬립 중 → 5초 대기 후 재시도
              await new Promise((res) => setTimeout(res, 5000));
              continue;
            }
            throw retryErr;
          }
        }
        if (!data) throw new Error('refresh_failed');

        await storage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) await storage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (refreshErr: any) {
        // 실제 401(토큰 만료/무효)일 때만 로그아웃, 네트워크 오류/500은 토큰 유지
        const status = refreshErr?.response?.status;
        if (status === 401) {
          await storage.deleteItem('accessToken');
          await storage.deleteItem('refreshToken');
        }
        // 네트워크 오류나 서버 재시작(500, 503 등)이면 토큰 유지 → 다음 앱 실행 시 재시도
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
