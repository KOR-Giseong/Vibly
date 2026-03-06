import { apiClient } from './api';
import type { SubscriptionType } from '@/types';

export const subscriptionService = {
  verifyPurchase: async (
    platform: 'IOS' | 'ANDROID' | 'WEB',
    productId: string,
    receiptData: string,
  ) => {
    const { data } = await apiClient.post('/credits/subscription/verify-purchase', {
      platform,
      productId,
      receiptData,
    });
    return data as { isPremium: boolean; expiresAt: string };
  },

  getAppConfig: async () => {
    const { data } = await apiClient.get<Record<string, string>>('/credits/app-config');
    return data;
  },

  startFreeTrial: async () => {
    const { data } = await apiClient.post<{ ok: boolean; expiresAt: string; durationDays: number }>(
      '/credits/subscription/trial',
    );
    return data;
  },

  adminGrantSubscription: async (userId: string, type: SubscriptionType, durationDays: number) => {
    const { data } = await apiClient.post('/credits/admin/subscriptions', {
      userId,
      type,
      durationDays,
    });
    return data;
  },

  adminRevokeSubscription: async (userId: string) => {
    await apiClient.delete(`/credits/admin/subscriptions/${userId}`);
  },

  adminListSubscriptions: async (page = 1, limit = 30) => {
    const { data } = await apiClient.get('/credits/admin/subscriptions', {
      params: { page, limit },
    });
    return data as {
      items: Array<{
        id: string;
        userId: string;
        type: SubscriptionType;
        expiresAt: string;
        createdAt: string;
        user: { id: string; name: string; nickname?: string; email?: string; avatarUrl?: string };
      }>;
      total: number;
      page: number;
      hasNext: boolean;
    };
  },

  adminGetAppConfig: async () => {
    const { data } = await apiClient.get<Record<string, string>>('/credits/admin/app-config');
    return data;
  },

  adminSetAppConfig: async (key: string, value: string) => {
    await apiClient.patch('/credits/admin/app-config', { key, value });
  },
};
