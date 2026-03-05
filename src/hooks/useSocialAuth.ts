import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AuthRequest, makeRedirectUri } from 'expo-auth-session';
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

// Google 웹/Android fallback redirect URI
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
      console.error(`[${provider}] finalizeSocialLogin 실패:`, e?.response?.data, e?.message, e?.response?.status);
      setError(e?.response?.data?.message ?? `${provider} 로그인에 실패했어요.`);
      setLoading(null);
    }
  };

  // ─── Google ──────────────────────────────────────────────────────────────
  // AuthRequest를 직접 생성해 codeVerifier 타이밍 문제 방지
  const googleClientId = Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '')
    : Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '')
    : (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '');

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

    try {
      // AuthRequest를 직접 생성 → promptAsync 호출 시점에 codeVerifier가 확정됨
      const request = new AuthRequest({
        clientId: googleClientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        usePKCE: true,
      });

      const result = await request.promptAsync(GOOGLE_DISCOVERY);

      if (result.type === 'success') {
        const code = result.params.code;
        const codeVerifier = request.codeVerifier;

        if (!code || !codeVerifier) {
          console.error('[Google OAuth] code/codeVerifier 없음 - code:', !!code, 'codeVerifier:', !!codeVerifier);
          setError('Google 로그인에 실패했어요.');
          setLoading(null);
          return;
        }

        // 직접 fetch로 code → id_token 교환 (code_verifier 확실히 포함)
        const params = new URLSearchParams({
          code,
          client_id: googleClientId,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        });

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.id_token) {
          await finalizeSocialLogin('google', tokenData.id_token);
        } else {
          console.error('[Google OAuth] token exchange 실패:', JSON.stringify(tokenData));
          setError('Google 로그인에 실패했어요.');
          setLoading(null);
        }
      } else if (result.type === 'error') {
        console.error('[Google OAuth] error result:', JSON.stringify(result));
        setError('Google 로그인에 실패했어요.');
        setLoading(null);
      } else if (result.type === 'dismiss') {
        setLoading(null);
      }
    } catch (err) {
      console.error('[Google OAuth] 실패:', err);
      setError('Google 로그인에 실패했어요.');
      setLoading(null);
    }
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

  // ─── Kakao (네이티브 SDK) ────────────────────────────────────────────────
  const signInWithKakao = async () => {
    setError('');
    setLoading('kakao');

    if (Platform.OS === 'web') {
      setError('웹에서는 카카오 로그인을 지원하지 않아요.');
      setLoading(null);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { login } = require('@react-native-seoul/kakao-login');
      const token = await login();
      await finalizeSocialLogin('kakao', token.accessToken);
    } catch (e: any) {
      console.error('[Kakao] 로그인 에러 code:', e?.code, 'message:', e?.message, 'detail:', JSON.stringify(e));
      const cancelCodes = ['ERR_CANCELED', 'E_CANCELLED', 'user_cancel'];
      if (!cancelCodes.includes(e?.code)) {
        setError(`카카오 로그인에 실패했어요. (${e?.code ?? e?.message ?? '알 수 없는 오류'})`);
      }
      setLoading(null);
    }
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
