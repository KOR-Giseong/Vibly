import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { SvgProps } from 'react-native-svg';
import KakaoTalkIcon from '@assets/KakaoTalk.svg';
import EmailIcon from '@assets/Emaillogin.svg';
import GoogleIcon from '@assets/Google.svg';
import AppleIcon from '@assets/Apple.svg';

// ─── 로그인 버튼 공통 컴포넌트 ────────────────────────────────────────────
type LoginButtonProps = {
  icon: React.FC<SvgProps>;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
};

const LoginButton = ({
  icon: Icon,
  label,
  onPress,
  backgroundColor,
  textColor,
  borderColor,
}: LoginButtonProps) => (
  <TouchableOpacity
    style={[
      styles.loginBtn,
      { backgroundColor },
      borderColor ? { borderWidth: 1, borderColor } : null,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.loginBtnIcon}>
      <Icon width={20} height={20} />
    </View>
    <Text style={[styles.loginBtnText, { color: textColor }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, setAuthenticated } = useAuthStore();

  const handleSocial = async (provider: 'kakao' | 'google' | 'apple') => {
    try {
      // TODO: 각 OAuth SDK 연동
      console.log('social login:', provider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmail = () => {
    router.push('/(auth)/email-login');
  };

  return (
    <LinearGradient
      colors={['#FAF5FF', '#FDF2F8', '#EFF6FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* 히어로 영역 */}
      <View style={styles.hero}>
        {/* 아이콘 박스 */}
        <LinearGradient
          colors={['#AD46FF', '#F6339A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBox}
        >
          <Text style={styles.iconEmoji}>✨</Text>
        </LinearGradient>

        {/* 앱 이름 */}
        <Text style={styles.appName}>Vibly</Text>
        <Text style={styles.appSlogan}>감정 기반 장소 추천</Text>

        {/* 환영 문구 */}
        <Text style={styles.welcomeTitle}>환영합니다</Text>
        <Text style={styles.welcomeDesc}>
          {'AI가 당신의 감정을 이해하고\n완벽한 장소를 추천해드려요'}
        </Text>
      </View>

      {/* 로그인 버튼 영역 */}
      <View style={[styles.btnArea, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <LoginButton
          icon={KakaoTalkIcon}
          label="카카오로 시작하기"
          onPress={() => handleSocial('kakao')}
          backgroundColor="#FEE500"
          textColor="#101828"
        />
        <LoginButton
          icon={EmailIcon}
          label="이메일로 시작하기"
          onPress={handleEmail}
          backgroundColor={Colors.white}
          textColor="#101828"
          borderColor="#E5E7EB"
        />
        <LoginButton
          icon={GoogleIcon}
          label="Google로 시작하기"
          onPress={() => handleSocial('google')}
          backgroundColor={Colors.white}
          textColor="#101828"
          borderColor="#E5E7EB"
        />
        <LoginButton
          icon={AppleIcon}
          label="Apple로 시작하기"
          onPress={() => handleSocial('apple')}
          backgroundColor="#000000"
          textColor={Colors.white}
        />

        {/* 약관 */}
        <Text style={styles.terms}>
          {'계속 진행하면 '}
          <Text style={styles.termsLink}>서비스 약관</Text>
          {' 및 '}
          <Text style={styles.termsLink}>개인정보 처리방침</Text>
          {'에\n동의하는 것으로 간주됩니다'}
        </Text>
      </View>
    </LinearGradient>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // 히어로
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconBox: {
    width: 128,
    height: 128,
    borderRadius: BorderRadius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    shadowColor: '#AD46FF',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 20,
  },
  iconEmoji: {
    fontSize: 60,
  },
  appName: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.extrabold,
    color: '#7C3AED',
    marginBottom: Spacing.xs,
  },
  appSlogan: {
    fontSize: FontSize.md,
    color: '#6A7282',
    marginBottom: Spacing['3xl'],
  },
  welcomeTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#101828',
    marginBottom: Spacing.md,
  },
  welcomeDesc: {
    fontSize: FontSize.md,
    color: '#4A5565',
    textAlign: 'center',
    lineHeight: 24,
  },

  // 버튼 영역
  btnArea: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  loginBtn: {
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  loginBtnIcon: {
    position: 'absolute',
    left: Spacing['3xl'],
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // 약관
  terms: {
    fontSize: FontSize.xs,
    color: '#6A7282',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: '#6A7282',
  },
});
