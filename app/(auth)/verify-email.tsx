import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '@assets/Back-icon.svg';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@constants/theme';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { useCoupleStore } from '@stores/couple.store';
import ScreenTransition from '@components/ScreenTransition';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const { setUser } = useAuthStore();
  const { setCredits, setPremium } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();

  const [codes, setCodes] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resendCooldown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newCodes = [...codes];
    newCodes[index] = digit;
    setCodes(newCodes);
    setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // 마지막 자리 입력 시 자동 제출
    if (digit && index === CODE_LENGTH - 1) {
      const code = [...newCodes.slice(0, CODE_LENGTH - 1), digit].join('');
      if (code.length === CODE_LENGTH) handleVerify(code);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !codes[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride ?? codes.join('');
    if (code.length !== CODE_LENGTH) {
      setError('6자리 코드를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyEmail(email, code);
      const user = await authService.getMe();
      setUser(user);
      if (typeof user.credits === 'number') {
        setCredits(user.credits);
        setPremium(user.isPremium);
      }
      setCoupleInfo(user?.couple ?? null);
      router.replace(user.isProfileComplete ? '/(tabs)' : '/(auth)/profile-setup');
    } catch (e: any) {
      const message = e?.response?.data?.message ?? '인증에 실패했어요. 다시 시도해주세요.';
      setError(message);
      setCodes(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authService.resendVerification(email);
      setResendCooldown(60);
      setCodes(Array(CODE_LENGTH).fill(''));
      setError('');
      inputs.current[0]?.focus();
      Alert.alert('재전송 완료', `${email}로 새 인증 코드를 보냈어요.`);
    } catch (e: any) {
      const message = e?.response?.data?.message ?? '재전송에 실패했어요.';
      Alert.alert('오류', message);
    } finally {
      setResending(false);
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
          <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
            {/* 헤더 */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>

            <View style={styles.content}>
              {/* 타이틀 */}
              <View style={styles.titleSection}>
                <View style={styles.iconWrap}>
                  <Text style={styles.iconText}>✉️</Text>
                </View>
                <Text style={styles.title}>이메일 인증</Text>
                <Text style={styles.subtitle}>
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {'\n'}으로 보낸 6자리 코드를 입력해주세요.
                </Text>
              </View>

              {/* OTP 입력칸 */}
              <View style={styles.codeRow}>
                {codes.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { inputs.current[i] = ref; }}
                    style={[
                      styles.codeInput,
                      digit ? styles.codeInputFilled : null,
                      error ? styles.codeInputError : null,
                    ]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* 에러 메시지 */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* 확인 버튼 */}
              <TouchableOpacity
                style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
                onPress={() => handleVerify()}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={['#7c3aed', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.verifyBtnGradient}
                  >
                    <Text style={styles.verifyBtnText}>인증 완료</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              {/* 재전송 */}
              <View style={styles.resendRow}>
                <Text style={styles.resendDesc}>코드를 받지 못했나요?</Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || resending}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                  ) : resendCooldown > 0 ? (
                    <Text style={styles.resendCooldown}>{resendCooldown}초 후 재전송</Text>
                  ) : (
                    <Text style={styles.resendBtn}>재전송</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.expireHint}>코드는 발송 후 10분간 유효해요.</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124,58,237,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: Colors.primary[600],
    fontWeight: FontWeight.semibold,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: '#fff',
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  codeInputFilled: {
    borderColor: Colors.primary[600],
    backgroundColor: 'rgba(124,58,237,0.04)',
  },
  codeInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#ef4444',
    textAlign: 'center',
  },
  verifyBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    height: 52,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
  },
  resendBtn: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary[600],
  },
  resendCooldown: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
  },
  expireHint: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
});
