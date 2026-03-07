import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Check } from 'lucide-react-native';
import { SvgProps } from 'react-native-svg';
import BackIcon from '@assets/Back-icon.svg';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { useCoupleStore } from '@stores/couple.store';
import { useSocialAuth } from '@hooks/useSocialAuth';
import KakaoTalkIcon from '@assets/KakaoTalk.svg';
import GoogleIcon from '@assets/Google.svg';
import AppleIcon from '@assets/Apple.svg';
import ScreenTransition from '@components/ScreenTransition';

type Mode = 'login' | 'signup';

// ─── 라벨 + 인풋 ──────────────────────────────────────────────────────────
type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  rightElement?: React.ReactNode;
};

const FormInput = ({
  label, value, onChangeText, placeholder,
  secureTextEntry, keyboardType, autoCapitalize, rightElement,
}: FormInputProps) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray[400]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {rightElement}
    </View>
  </View>
);

// ─── 소셜 버튼 ────────────────────────────────────────────────────────────
type SocialButtonProps = {
  icon: React.FC<SvgProps>;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  loading?: boolean;
  disabled?: boolean;
};

const SocialButton = ({
  icon: Icon, label, onPress, backgroundColor, textColor, borderColor, loading, disabled,
}: SocialButtonProps) => (
  <TouchableOpacity
    style={[
      styles.socialBtn,
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
        <View style={styles.socialBtnIcon}><Icon width={20} height={20} /></View>
        <Text style={[styles.socialBtnText, { color: textColor }]}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function EmailLoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const { setCredits, setPremium } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();
  const { signInWithKakao, signInWithGoogle, signInWithApple, loading: socialLoading, error: socialError, clearError: clearSocialError } = useSocialAuth();

  const isAnyLoading = loading || socialLoading !== null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setName('');
    setPassword('');
    setConfirmPw('');
    setAgreeTerms(false);
    setAgreePrivacy(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password !== confirmPw) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    if (mode === 'signup' && (!agreeTerms || !agreePrivacy)) {
      setError('서비스 약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await authService.emailLogin(email, password);
      } else {
        await authService.emailSignup(email, password, name);
      }

      const user = await authService.getMe();
      setUser(user);
      if (typeof user.credits === 'number') {
        setCredits(user.credits);
        setPremium(user.isPremium);
      }
      setCoupleInfo(user?.couple ?? null);
      router.replace(user.isProfileComplete ? '/(tabs)' : '/(auth)/profile-setup');
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message ?? '요청에 실패했어요. 다시 시도해주세요.';
      // 404: 계정 없음 → 회원가입 유도
      if (mode === 'login' && status === 404) {
        Alert.alert(
          '계정이 없어요',
          `${email}로 등록된 계정이 없어요.\n회원가입 하시겠어요?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '회원가입', onPress: () => switchMode('signup') },
          ],
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScreenTransition>
    <LinearGradient
      colors={['#FAF5FF', '#FDF2F8', '#EFF6FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BackIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'login' ? '로그인' : '회원가입'}
            </Text>
            <View style={styles.backBtnSpacer} />
          </View>

          {/* 탭 */}
          <View style={styles.tabs}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => switchMode(m)}
                activeOpacity={0.7}
              >
                {mode === m && (
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? '로그인' : '회원가입'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 에러 */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 폼 */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <FormInput
                label="이름"
                value={name}
                onChangeText={setName}
                placeholder="홍길동"
                autoCapitalize="words"
              />
            )}
            <FormInput
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPw(!showPw)}
                  style={styles.eyeBtn}
                >
                  {showPw
                    ? <EyeOff size={18} color={Colors.gray[400]} />
                    : <Eye size={18} color={Colors.gray[400]} />
                  }
                </TouchableOpacity>
              }
            />
            {mode === 'signup' && (
              <FormInput
                label="비밀번호 확인"
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="••••••••"
                secureTextEntry={!showPw}
              />
            )}
          </View>

          {/* 약관 동의 (회원가입 전용) */}
          {mode === 'signup' && (
            <View style={styles.agreeWrap}>
              <TouchableOpacity
                style={styles.agreeRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                  {agreeTerms && <Check size={12} color={Colors.white} strokeWidth={3} />}
                </View>
                <Text style={styles.agreeText}>
                  <Text style={styles.agreeRequired}>[필수] </Text>
                  <Text
                    style={styles.agreeLink}
                    onPress={(e) => { e.stopPropagation?.(); router.push('/terms'); }}
                  >서비스 이용약관</Text>
                  {'에 동의합니다'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.agreeRow}
                onPress={() => setAgreePrivacy(!agreePrivacy)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreePrivacy && styles.checkboxActive]}>
                  {agreePrivacy && <Check size={12} color={Colors.white} strokeWidth={3} />}
                </View>
                <Text style={styles.agreeText}>
                  <Text style={styles.agreeRequired}>[필수] </Text>
                  <Text
                    style={styles.agreeLink}
                    onPress={(e) => { e.stopPropagation?.(); router.push('/privacy'); }}
                  >개인정보 처리방침</Text>
                  {'에 동의합니다'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[styles.submitBtn, isAnyLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isAnyLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
            />
            {isAnyLoading && !socialLoading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.submitText}>{mode === 'login' ? '로그인' : '회원가입'}</Text>
            }
          </TouchableOpacity>

          {/* 비밀번호 찾기 */}
          {mode === 'login' && (
            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          )}

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 에러 (30일 제한 등) */}
          {!!socialError && (
            <TouchableOpacity style={styles.errorBox} onPress={clearSocialError} activeOpacity={0.8}>
              <Text style={styles.errorText}>{socialError}</Text>
            </TouchableOpacity>
          )}

          {/* 소셜 로그인 */}
          <View style={styles.socialArea}>
            <SocialButton
              icon={KakaoTalkIcon}
              label="카카오로 계속하기"
              onPress={signInWithKakao}
              backgroundColor="#FEE500"
              textColor="#101828"
              loading={socialLoading === 'kakao'}
              disabled={isAnyLoading}
            />
            <SocialButton
              icon={GoogleIcon}
              label="Google로 계속하기"
              onPress={signInWithGoogle}
              backgroundColor={Colors.white}
              textColor="#101828"
              borderColor="#E5E7EB"
              loading={socialLoading === 'google'}
              disabled={isAnyLoading}
            />
            {Platform.OS === 'ios' && (
              <SocialButton
                icon={AppleIcon}
                label="Apple로 계속하기"
                onPress={signInWithApple}
                backgroundColor="#000000"
                textColor={Colors.white}
                loading={socialLoading === 'apple'}
                disabled={isAnyLoading}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </ScreenTransition>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing['2xl'],
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['3xl'],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  backBtnSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },

  // 탭
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing['2xl'],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.gray[400],
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

  // 에러
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FontSize.sm,
  },

  // 폼
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[700],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.gray[900],
  },
  eyeBtn: {
    padding: Spacing.xs,
  },

  // 제출 버튼
  submitBtn: {
    height: 52,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  submitText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // 약관 동의
  agreeWrap: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: '#9810FA',
    borderColor: '#9810FA',
  },
  agreeText: {
    fontSize: FontSize.sm,
    color: Colors.gray[600],
    flex: 1,
  },
  agreeRequired: {
    color: '#9810FA',
    fontWeight: FontWeight.semibold,
  },
  agreeLink: {
    textDecorationLine: 'underline',
    color: Colors.gray[700],
    fontWeight: FontWeight.medium,
  },

  // 비밀번호 찾기
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: '#7C3AED',
    fontWeight: FontWeight.medium,
  },

  // 구분선
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
  },

  // 소셜 버튼
  socialArea: {
    gap: Spacing.md,
  },
  socialBtn: {
    height: 52,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  socialBtnIcon: {
    position: 'absolute',
    left: Spacing['3xl'],
  },
  socialBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
