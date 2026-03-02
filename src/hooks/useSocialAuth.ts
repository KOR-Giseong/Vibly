import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { useCoupleStore } from '@stores/couple.store';
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

// 카카오 등 다른 소셜 로그인용 (vibly:// 스킴)
export const SOCIAL_REDIRECT_URI = makeRedirectUri({ scheme: 'vibly', path: 'auth' });

// Google redirect URI
// iOS: iOS 타입 클라이언트의 리버스 클라이언트 ID 스킴 (Google이 자동 허용)
// Android: Android 타입 클라이언트 사용 (패키지명+SHA-1 기반, 별도 redirect 불필요)
// Web: Web 타입 클라이언트
const IOS_GOOGLE_REDIRECT_URI = 'com.googleusercontent.apps.506939484809-5b9mm794vt3hhdo5p95qho4ksi7gstv8:/';
const GOOGLE_REDIRECT_URI = Platform.OS === 'ios'
  ? IOS_GOOGLE_REDIRECT_URI
  : SOCIAL_REDIRECT_URI; // web / android

export function useSocialAuth() {
  const { setUser } = useAuthStore();
  const { setCredits, setPremium } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();
  const [loading, setLoading] = useState<'kakao' | 'google' | 'apple' | null>(null);
  const [error, setError] = useState('');

  // ─── 공통: 소셜 로그인 완료 처리 ────────────────────────────────────────────
  const finalizeSocialLogin = async (
    provider: 'kakao' | 'google' | 'apple',
    token: string,
    redirectUri?: string,
    name?: string,
    codeVerifier?: string,
  ) => {
    try {
      await authService.socialLogin(provider, token, redirectUri, name, codeVerifier);
      const user = await authService.getMe();
      setUser(user);
      if (typeof user.credits === 'number') {
        setCredits(user.credits);
        setPremium(user.isPremium);
      }
      setCoupleInfo(user?.couple ?? null);
      // 신규 사용자(프로필 미완성) → 프로필 설정, 기존 사용자 → 홈
      if (!user.isProfileComplete) {
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? `${provider} 로그인에 실패했어요.`);
      setLoading(null);
    }
  };

  // ─── Google ──────────────────────────────────────────────────────────────
  // 네이티브(iOS/Android): Desktop 앱 유형 클라이언트 → vibly:// 커스텀 스킴 허용
  // Web: Web 유형 클라이언트
  const googleClientId = Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '')
    : Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '')
    : (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '');

  const [googleRequest, googleResponse, googlePromptAsync] = useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: GOOGLE_REDIRECT_URI,
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const code = googleResponse.params.code;
      if (code) finalizeSocialLogin('google', code, GOOGLE_REDIRECT_URI, undefined, googleRequest?.codeVerifier);
    } else if (googleResponse.type === 'error') {
      setError('Google 로그인에 실패했어요.');
      setLoading(null);
    } else if (googleResponse.type === 'dismiss') {
      setLoading(null);
    }
  }, [googleResponse]);

  const signInWithGoogle = async () => {
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
        const given = credential.fullName?.givenName ?? '';
        const family = credential.fullName?.familyName ?? '';
        const appleName = [family, given].filter(Boolean).join('') || undefined;
        await finalizeSocialLogin('apple', credential.identityToken, undefined, appleName);
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
