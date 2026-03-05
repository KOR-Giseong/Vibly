import React from 'react';
import {
  View,
  Text,
  TextStyle,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useSocialAuth } from '@hooks/useSocialAuth';
import { SvgProps } from 'react-native-svg';
import KakaoTalkIcon from '@assets/KakaoTalk.svg';
import EmailIcon from '@assets/Emaillogin.svg';
import GoogleIcon from '@assets/Google.svg';
import AppleIcon from '@assets/Apple.svg';
import ScreenTransition from '@components/ScreenTransition';

// ─── 그라디언트 텍스트 (웹: CSS clip, 네이티브: MaskedView) ─────────────────
const GRADIENT_COLORS: [string, string] = ['#9810FA', '#E60076'];

const GradientText = ({ children, style }: { children: string; style?: TextStyle }) => {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          style,
          {
            background: 'linear-gradient(to right, #9810FA, #E60076)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            overflow: 'visible',
            paddingBottom: 6,
          } as any,
        ]}
      >
        {children}
      </Text>
    );
  }

  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

// ─── 로그인 버튼 공통 컴포넌트 ────────────────────────────────────────────
type LoginButtonProps = {
  icon: React.FC<SvgProps>;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  loading?: boolean;
  disabled?: boolean;
};

const LoginButton = ({
  icon: Icon,
  label,
  onPress,
  backgroundColor,
  textColor,
  borderColor,
  loading,
  disabled,
}: LoginButtonProps) => (
  <TouchableOpacity
    style={[
      styles.loginBtn,
      { backgroundColor },
      borderColor ? { borderWidth: 1, borderColor } : null,
      disabled ? { opacity: 0.6 } : null,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    {loading ? (
      <ActivityIndicator color={textColor} size="small" />
    ) : (
      <>
        <View style={styles.loginBtnIcon}>
          <Icon width={20} height={20} />
        </View>
        <Text style={[styles.loginBtnText, { color: textColor }]}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithKakao, signInWithGoogle, signInWithApple, loading, error, clearError } = useSocialAuth();

  const isAnyLoading = loading !== null;

  const handleEmail = () => {
    if (isAnyLoading) return;
    router.push('/(auth)/email-login');
  };

  return (
    <ScreenTransition>
    <LinearGradient
      colors={['#FAF5FF', '#FDF2F8', '#EFF6FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* 히어로 영역 */}
      <View style={styles.hero}>
        {/* 앱 이름 + 슬로건 (로고 위) */}
        <GradientText style={styles.appName}>Vibly</GradientText>
        <Text style={styles.appSlogan}>감성 기반 장소 추천</Text>

        {/* 로고 이미지 */}
        <Image
          source={require('@assets/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* 환영 문구 */}
        <Text style={styles.welcomeTitle}>환영합니다!</Text>
        <Text style={styles.welcomeDesc}>
          {'AI가 당신의 감정을 이해하고\n완벽한 장소를 추천해드려요!'}
        </Text>
      </View>

      {/* 로그인 버튼 영역 */}
      <View style={[styles.btnArea, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        {!!error && (
          <TouchableOpacity style={styles.errorBox} onPress={clearError} activeOpacity={0.8}>
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        )}
        <LoginButton
          icon={KakaoTalkIcon}
          label="카카오로 시작하기"
          onPress={signInWithKakao}
          backgroundColor="#FEE500"
          textColor="#101828"
          loading={loading === 'kakao'}
          disabled={isAnyLoading}
        />
        <LoginButton
          icon={EmailIcon}
          label="이메일로 시작하기"
          onPress={handleEmail}
          backgroundColor={Colors.white}
          textColor="#101828"
          borderColor="#E5E7EB"
          disabled={isAnyLoading}
        />
        <LoginButton
          icon={GoogleIcon}
          label="Google로 시작하기"
          onPress={signInWithGoogle}
          backgroundColor={Colors.white}
          textColor="#101828"
          borderColor="#E5E7EB"
          loading={loading === 'google'}
          disabled={isAnyLoading}
        />
        {Platform.OS === 'ios' && (
          <LoginButton
            icon={AppleIcon}
            label="Apple로 시작하기"
            onPress={signInWithApple}
            backgroundColor="#000000"
            textColor={Colors.white}
            loading={loading === 'apple'}
            disabled={isAnyLoading}
          />
        )}

        {/* 약관 */}
        <Text style={styles.terms}>
          {'계속 진행하면 '}
          <Text style={styles.termsLink} onPress={() => router.push('/terms')}>서비스 약관</Text>
          {' 및 '}
          <Text style={styles.termsLink} onPress={() => router.push('/privacy')}>개인정보 처리방침</Text>
          {'에\n동의하는 것으로 간주됩니다'}
        </Text>
      </View>
    </LinearGradient>
    </ScreenTransition>
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
  appName: {
    fontSize: FontSize['4xl'],   // 40 → 32
    fontWeight: FontWeight.bold,
    lineHeight: 44,
    marginBottom: Spacing.xs,
  },
  appSlogan: {
    fontSize: FontSize.base,     // 16 → 14
    color: '#6A7282',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 112,
    height: 112,
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: FontSize.xl,       // 24 → 20
    fontWeight: FontWeight.bold,
    color: '#101828',
    marginBottom: Spacing.sm,
  },
  welcomeDesc: {
    fontSize: FontSize.base,     // 16 → 14
    color: '#4A5565',
    textAlign: 'center',
    lineHeight: 22,
  },

  // 버튼 영역
  btnArea: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  loginBtn: {
    height: 52,
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
    fontSize: FontSize.base,     // 16 → 14
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

  // 에러
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
  },
});
