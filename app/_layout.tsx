import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

function RootLayoutNav() {
  const { setUser, setAuthenticated } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setIsLoaded(true);
      }
    })();
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
        <Stack.Screen name="place/[id]" />
        <Stack.Screen name="map" />
        <Stack.Screen name="checkin" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="vibe-report" />
        <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" />
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
