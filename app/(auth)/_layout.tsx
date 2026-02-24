import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.isProfileComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
