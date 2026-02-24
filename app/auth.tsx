import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { SOCIAL_REDIRECT_URI } from '@hooks/useSocialAuth';

export default function AuthCallback() {
  const params = useLocalSearchParams();
  const code = params.code as string | undefined;
  const error = params.error as string | undefined;
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const provider = sessionStorage.getItem('oauthProvider') as 'google' | 'kakao' | null;
    sessionStorage.removeItem('oauthProvider');

    if (!provider || !code || error) {
      router.replace('/(auth)/login');
      return;
    }

    authService
      .socialLogin(provider, code, SOCIAL_REDIRECT_URI)
      .then(() => authService.getMe())
      .then((user) => {
        setUser(user);
        router.replace(user.isProfileComplete ? '/(tabs)' : '/(auth)/profile-setup');
      })
      .catch(() => {
        router.replace('/(auth)/login');
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={{ marginTop: 16, color: '#666', fontSize: 14 }}>로그인 중...</Text>
    </View>
  );
}
