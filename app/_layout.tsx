import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { useCoupleStore } from '@stores/couple.store';
import { authService } from '@services/auth.service';
import { notificationApi } from '@services/notification.service';

// 포그라운드 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

function RootLayoutNav() {
  const router = useRouter();
  const { setUser, setAuthenticated, isAuthenticated } = useAuthStore();
  const { setCredits, setPremium } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const notifResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
        setAuthenticated(true);
        // getMe 응답에 포함된 크레딧 즉시 반영
        if (user && typeof user.credits === 'number') {
          setCredits(user.credits);
          setPremium(user.isPremium);
        }
        setCoupleInfo(user?.couple ?? null);
        if (user?.status === 'SUSPENDED') {
          router.replace('/suspended');
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setIsLoaded(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 푸시 토큰 등록 + 알림 응답 핸들러 ─────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !isAuthenticated) return;

    void (async () => {
      try {
        // Android 알림 채널 생성 (Android 8+ 필수)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Vibly 알림',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            lightColor: '#7C3AED',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: false,
          });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        const { status } =
          existing !== 'granted'
            ? await Notifications.requestPermissionsAsync()
            : { status: existing };

        if (status !== 'granted') return;

        // 수동으로 알림을 끌 경우 토큰 재등록 안 함
        const notifPref = await AsyncStorage.getItem('vibly_push_enabled');
        if (notifPref === 'false') {
          // 알림 꺼진 경우 토큰 재등록 스킵, Cold start 처리만
          const lastResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastResponse) {
            const data = lastResponse.notification.request.content.data as Record<string, unknown>;
            if (data?.screen) {
              router.push(data.screen as Parameters<typeof router.push>[0]);
            } else {
              router.push('/notifications');
            }
          }
          return;
        }

        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
            ?.projectId ?? Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await notificationApi.registerToken(tokenData.data, platform).catch(() => {});
      } catch {
        // 토큰 등록 실패 시 무시 (시뮬레이터 등 환경)
      }

      // Cold start: 앱이 종료된 상태에서 알림 탭으로 실행된 경우
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data as Record<string, unknown>;
        if (data?.screen) {
          router.push(data.screen as Parameters<typeof router.push>[0]);
        } else {
          router.push('/notifications');
        }
      }
    })();

    // 포그라운드/백그라운드에서 알림 탭 → 화면 이동 핸들러
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.screen) {
          router.push(data.screen as Parameters<typeof router.push>[0]);
        } else {
          router.push('/notifications');
        }
      },
    );

    return () => {
      notifResponseListener.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isAuthenticated]);

  if (!isLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="suspended" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="place/[id]" />
        <Stack.Screen name="map" />
        <Stack.Screen name="checkin" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="my-checkins" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="vibe-report" />
        <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="credits" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="couple-lounge" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="couple/date-plan-form" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="couple/ai-analysis" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
