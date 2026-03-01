import { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { useCoupleStore } from '@stores/couple.store';
import { authService } from '@services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

function RootLayoutNav() {
  const router = useRouter();
  const { setUser, setAuthenticated } = useAuthStore();
  const { setCredits, setPremium } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();
  const [isLoaded, setIsLoaded] = useState(false);

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
