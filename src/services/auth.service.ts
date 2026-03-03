import { apiClient } from './api';
import { storage } from '@utils/storage';
import type { AuthTokens, User } from '@/types';

export const authService = {
  async emailLogin(email: string, password: string): Promise<AuthTokens | { requireVerification: true; email: string }> {
    const { data } = await apiClient.post<AuthTokens | { requireVerification: true; email: string }>('/auth/email/login', { email, password });
    if ('requireVerification' in data) return data;
    await saveTokens(data);
    return data;
  },

  async emailSignup(email: string, password: string, name: string): Promise<AuthTokens | { requireVerification: true; email: string }> {
    const { data } = await apiClient.post<AuthTokens | { requireVerification: true; email: string }>('/auth/email/signup', { email, password, name });
    if ('requireVerification' in data) return data;
    await saveTokens(data);
    return data;
  },

  async verifyEmail(email: string, code: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/email/verify', { email, code });
    await saveTokens(data);
    return data;
  },

  async resendVerification(email: string): Promise<void> {
    await apiClient.post('/auth/email/resend', { email });
  },

  async socialLogin(
    provider: 'kakao' | 'google' | 'apple',
    idToken: string,
    redirectUri?: string,
    name?: string,
    codeVerifier?: string,
  ): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(`/auth/${provider}`, { idToken, redirectUri, name, codeVerifier });
    await saveTokens(data);
    return data;
  },

  async logout(pushToken?: string): Promise<void> {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      // 디바이스 푸시 토큰 삭제 (로그아웃 후 알림 수신 차단)
      await apiClient
        .delete('/notifications/register-token', {
          params: pushToken ? { pushToken } : undefined,
        })
        .catch(() => {});
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      await clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  async getUserStats(): Promise<{ checkinCount: number; bookmarkCount: number; reviewCount: number }> {
    const { data } = await apiClient.get<{ checkinCount: number; bookmarkCount: number; reviewCount: number }>('/auth/stats');
    return data;
  },

  async updateProfile(data: { name?: string; nickname?: string; gender?: string; preferredVibes?: string[] }): Promise<User> {
    const { data: res } = await apiClient.patch<User>('/auth/profile', data);
    return res;
  },

  async updateAvatar(base64: string): Promise<{ avatarUrl: string }> {
    const { data } = await apiClient.patch<{ avatarUrl: string }>('/auth/avatar', { base64 });
    return data;
  },

  async resetAvatar(): Promise<void> {
    await apiClient.delete('/auth/avatar');
  },

  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    const { data } = await apiClient.get<{ available: boolean }>('/auth/check-nickname', {
      params: { nickname },
    });
    return data;
  },

  async deleteAccount(): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete<{ success: boolean }>('/auth/account');
    await clearTokens();
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.patch<{ success: boolean }>('/auth/password', {
      currentPassword,
      newPassword,
    });
    return data;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem('accessToken');
    return Boolean(token);
  },
};

async function saveTokens(tokens: AuthTokens) {
  await storage.setItem('accessToken', tokens.accessToken);
  await storage.setItem('refreshToken', tokens.refreshToken);
}

async function clearTokens() {
  await storage.deleteItem('accessToken');
  await storage.deleteItem('refreshToken');
}
