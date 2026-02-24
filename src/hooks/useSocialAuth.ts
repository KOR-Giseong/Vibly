import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';

WebBrowser.maybeCompleteAuthSession();

// ─── OAuth 엔드포인트 ─────────────────────────────────────────────────────────
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const KAKAO_DISCOVERY = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

export const SOCIAL_REDIRECT_URI = makeRedirectUri({ scheme: 'vibly', path: 'auth' });

export function useSocialAuth() {
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState<'kakao' | 'google' | 'apple' | null>(null);
  const [error, setError] = useState('');

  // ─── 공통: 소셜 로그인 완료 처리 ────────────────────────────────────────────
  const finalizeSocialLogin = async (
    provider: 'kakao' | 'google' | 'apple',
    token: string,
    redirectUri?: string,
  ) => {
    try {
      await authService.socialLogin(provider, token, redirectUri);
      const user = await authService.getMe();
      setUser(user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? `${provider} 로그인에 실패했어요.`);
      setLoading(null);
    }
  };

  // ─── Google ──────────────────────────────────────────────────────────────
  const googleClientId = Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '')
    : Platform.OS === 'android'
    ? (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '')
    : (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '');

  const [, googleResponse, googlePromptAsync] = useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: SOCIAL_REDIRECT_URI,
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const code = googleResponse.params.code;
      if (code) finalizeSocialLogin('google', code, SOCIAL_REDIRECT_URI);
    } else if (googleResponse.type === 'error') {
      setError('Google 로그인에 실패했어요.');
      setLoading(null);
    } else if (googleResponse.type === 'dismiss') {
      setLoading(null);
    }
  }, [googleResponse]);

  const signInWithGoogle = async () => {
    console.log('[Google] signInWithGoogle called, Platform.OS:', Platform.OS, 'clientId:', googleClientId);
    if (!googleClientId) {
      setError('Google 클라이언트 ID가 설정되지 않았어요.');
      return;
    }
    setError('');
    setLoading('google');

    // 웹: 팝업(COOP 차단) 대신 페이지 리다이렉트 방식 사용
    if (Platform.OS === 'web') {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', googleClientId);
      url.searchParams.set('redirect_uri', SOCIAL_REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid profile email');
      console.log('[Google] Redirecting to:', url.toString());
      console.log('[Google] REDIRECT_URI:', SOCIAL_REDIRECT_URI);
      sessionStorage.setItem('oauthProvider', 'google');
      window.location.href = url.toString();
      return;
    }

    await googlePromptAsync();
  };

  // ─── Apple (iOS 전용) ────────────────────────────────────────────────────
  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') return;
    try {
      setError('');
      setLoading('apple');
      const AppleAuth = await import('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await finalizeSocialLogin('apple', credential.identityToken);
      } else {
        setLoading(null);
      }
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple 로그인에 실패했어요.');
      }
      setLoading(null);
    }
  };

  // ─── Kakao ───────────────────────────────────────────────────────────────
  const [, kakaoResponse, kakaoPromptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '',
      scopes: ['profile_nickname', 'account_email'],
      redirectUri: SOCIAL_REDIRECT_URI,
      usePKCE: false,
    },
    KAKAO_DISCOVERY,
  );

  useEffect(() => {
    if (!kakaoResponse) return;
    if (kakaoResponse.type === 'success') {
      const code = kakaoResponse.params.code;
      if (code) finalizeSocialLogin('kakao', code, SOCIAL_REDIRECT_URI);
    } else if (kakaoResponse.type === 'error') {
      setError('카카오 로그인에 실패했어요.');
      setLoading(null);
    } else if (kakaoResponse.type === 'dismiss') {
      setLoading(null);
    }
  }, [kakaoResponse]);

  const signInWithKakao = async () => {
    setError('');
    setLoading('kakao');

    // 웹: 페이지 리다이렉트 방식 사용
    if (Platform.OS === 'web') {
      const url = new URL('https://kauth.kakao.com/oauth/authorize');
      url.searchParams.set('client_id', process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '');
      url.searchParams.set('redirect_uri', SOCIAL_REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      sessionStorage.setItem('oauthProvider', 'kakao');
      window.location.href = url.toString();
      return;
    }

    await kakaoPromptAsync();
  };

  return {
    signInWithGoogle,
    signInWithApple,
    signInWithKakao,
    loading,
    error,
    clearError: () => setError(''),
  };
}
