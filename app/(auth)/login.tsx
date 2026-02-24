import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients } from '@constants/theme';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, setAuthenticated } = useAuthStore();

  const handleSocial = async (provider: 'kakao' | 'google' | 'apple') => {
    try {
      // TODO: integrate actual OAuth SDK per provider
      // const idToken = await oauthFlow(provider);
      // const { user } = await authService.socialLogin(provider, idToken);
      // setUser(user); setAuthenticated(true);
      console.log('social login:', provider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Logo */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.logoEmoji}>✨</Text>
        </View>
        <Text style={styles.appName}>Vibly</Text>
        <Text style={styles.slogan}>지금 내 기분에 딱 맞는 공간을 찾다</Text>
      </View>

      {/* Social Buttons */}
      <View style={[styles.btns, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity onPress={() => handleSocial('kakao')} style={styles.kakaoBtn} activeOpacity={0.85}>
          <Text style={styles.kakaoBtnText}>💛 카카오로 계속하기</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleSocial('google')} style={styles.googleBtn} activeOpacity={0.85}>
          <Text style={styles.googleBtnText}>🌐 Google로 계속하기</Text>
        </TouchableOpacity>

        <Button variant="apple" size="lg" style={styles.fullWidth} onPress={() => handleSocial('apple')}>
          🍎  Apple로 계속하기
        </Button>

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>또는</Text>
          <View style={styles.divLine} />
        </View>

        <Button variant="outline" size="lg" style={styles.fullWidth} onPress={() => router.push('/(auth)/email-login')}>
          이메일로 계속하기
        </Button>

        <Text style={styles.terms}>
          계속하면 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
          <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: Colors.primary[700], marginBottom: Spacing.sm },
  slogan: { fontSize: FontSize.base, color: Colors.gray[500], textAlign: 'center' },
  btns: { paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  kakaoBtn: {
    backgroundColor: Colors.kakao, borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'center',
  },
  kakaoBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[900] },
  googleBtn: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gray[200],
  },
  googleBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[900] },
  fullWidth: { width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.gray[200] },
  divText: { fontSize: FontSize.sm, color: Colors.gray[400] },
  terms: { fontSize: FontSize.xs, color: Colors.gray[400], textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.primary[600], fontWeight: FontWeight.medium },
});
