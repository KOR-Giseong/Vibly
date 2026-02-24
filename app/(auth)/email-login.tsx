import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { Button } from '@components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';

type Mode = 'login' | 'signup';

export default function EmailLoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, setAuthenticated } = useAuthStore();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    if (mode === 'signup' && password !== confirmPw) { setError('비밀번호가 일치하지 않아요.'); return; }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authService.emailLogin(email, password)
        : await authService.emailSignup(email, password, name);
      setUser(res.user);
      setAuthenticated(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={24} color={Colors.gray[700]} />
          </TouchableOpacity>

          <Text style={styles.title}>{mode === 'login' ? '다시 만나서 반가워요 👋' : '새 계정 만들기 ✨'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? '이메일로 로그인하세요' : '무료로 시작해보세요'}
          </Text>

          {/* Mode Toggle */}
          <View style={styles.toggle}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <TouchableOpacity key={m} style={[styles.toggleBtn, mode === m && styles.toggleActive]} onPress={() => setMode(m)}>
                {mode === m && (
                  <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                )}
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? '로그인' : '회원가입'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <User size={18} color={Colors.gray[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="이름"
                  placeholderTextColor={Colors.gray[400]}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Mail size={18} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor={Colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="비밀번호"
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw ? <EyeOff size={18} color={Colors.gray[400]} /> : <Eye size={18} color={Colors.gray[400]} />}
              </TouchableOpacity>
            </View>

            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Lock size={18} color={Colors.gray[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호 확인"
                  placeholderTextColor={Colors.gray[400]}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showPw}
                />
              </View>
            )}
          </View>

          <Button size="lg" isLoading={loading} onPress={handleSubmit} style={styles.submitBtn}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing['2xl'] },
  back: { marginTop: Spacing.sm, marginBottom: Spacing['3xl'] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.base, color: Colors.gray[500], marginBottom: Spacing['3xl'] },
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg, padding: 4, marginBottom: Spacing['2xl'],
  },
  toggleBtn: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: BorderRadius.md, overflow: 'hidden',
  },
  toggleActive: {},
  toggleText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.gray[500] },
  toggleTextActive: { color: Colors.white },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  errorText: { color: '#EF4444', fontSize: FontSize.sm },
  form: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    borderWidth: 1.5, borderColor: Colors.gray[200],
    paddingHorizontal: Spacing.lg, ...Shadow.sm,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, paddingVertical: Spacing.lg, fontSize: FontSize.md, color: Colors.gray[900] },
  eyeBtn: { padding: Spacing.sm },
  submitBtn: { width: '100%' },
});
