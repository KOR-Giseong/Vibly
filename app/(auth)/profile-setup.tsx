import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react-native';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

// ─── 선택 가능한 분위기 ───────────────────────────────────────────────────────
const VIBES = [
  { emoji: '☕', label: '아늑한' },
  { emoji: '✨', label: '트렌디한' },
  { emoji: '🌿', label: '조용한' },
  { emoji: '🎉', label: '활기찬' },
  { emoji: '💕', label: '로맨틱한' },
  { emoji: '🎸', label: '힙한' },
  { emoji: '🌊', label: '자연적인' },
  { emoji: '📚', label: '감성적인' },
  { emoji: '🏙️', label: '도시적인' },
  { emoji: '🎨', label: '예술적인' },
];

type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    if (nicknameStatus !== 'idle') setNicknameStatus('idle');
  };

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setNicknameStatus('checking');
    try {
      const { available } = await authService.checkNickname(trimmed);
      setNicknameStatus(available ? 'available' : 'taken');
    } catch {
      setNicknameStatus('idle');
    }
  };

  const toggleVibe = (label: string) => {
    setSelectedVibes((prev) =>
      prev.includes(label)
        ? prev.filter((v) => v !== label)
        : prev.length < 3
        ? [...prev, label]
        : prev,
    );
  };

  const handleComplete = async () => {
    if (nicknameStatus !== 'available') {
      setError('닉네임 중복확인을 해주세요.');
      return;
    }
    if (!gender) {
      setError('성별을 선택해주세요.');
      return;
    }
    if (selectedVibes.length === 0) {
      setError('분위기를 하나 이상 선택해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({ nickname: nickname.trim(), gender, preferredVibes: selectedVibes });
      setUser(updatedUser);
      router.replace('/welcome');
    } catch {
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const canCheckNickname = nickname.trim().length > 0 && nicknameStatus !== 'checking';
  const canSubmit = nicknameStatus === 'available' && !!gender && selectedVibes.length > 0;

  const inputBorderColor =
    nicknameStatus === 'available' ? '#10B981' :
    nicknameStatus === 'taken' ? '#EF4444' :
    Colors.gray[200];

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
            { paddingTop: insets.top + Spacing['2xl'], paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Sparkles size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>당신만의 바이브를{'\n'}알려주세요!</Text>
            <Text style={styles.subtitle}>
              취향에 꼭 맞는 장소를 추천해드릴게요!
            </Text>
          </View>

          {/* 닉네임 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>닉네임</Text>
            <View style={[styles.inputWrap, { borderColor: inputBorderColor }]}>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={handleNicknameChange}
                placeholder="앱에서 사용할 닉네임을 입력해주세요"
                placeholderTextColor={Colors.gray[400]}
                maxLength={12}
                autoCapitalize="none"
              />
              <Text style={styles.inputCount}>{nickname.length}/12</Text>
              <TouchableOpacity
                onPress={handleCheckNickname}
                disabled={!canCheckNickname}
                activeOpacity={0.8}
                style={[styles.checkBtn, !canCheckNickname && { opacity: 0.4 }]}
              >
                {nicknameStatus === 'checking'
                  ? <ActivityIndicator size="small" color="#9810FA" />
                  : <Text style={styles.checkBtnText}>중복확인</Text>
                }
              </TouchableOpacity>
            </View>

            {nicknameStatus === 'available' && (
              <View style={styles.statusRow}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={[styles.statusText, { color: '#10B981' }]}>사용 가능한 닉네임이에요.</Text>
              </View>
            )}
            {nicknameStatus === 'taken' && (
              <View style={styles.statusRow}>
                <XCircle size={14} color="#EF4444" />
                <Text style={[styles.statusText, { color: '#EF4444' }]}>이미 사용 중인 닉네임이에요.</Text>
              </View>
            )}
          </View>

          {/* 성별 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>성별</Text>
            <View style={styles.genderRow}>
              {([['MALE', '남성', '👨'], ['FEMALE', '여성', '👩']] as const).map(([val, label, emoji]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setGender(val)}
                  activeOpacity={0.8}
                  style={styles.genderChipWrap}
                >
                  {gender === val ? (
                    <LinearGradient
                      colors={['#9810FA', '#E60076']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.genderChip}
                    >
                      <Text style={styles.genderEmoji}>{emoji}</Text>
                      <Text style={[styles.genderLabel, styles.genderLabelSelected]}>{label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.genderChip, styles.genderChipUnselected]}>
                      <Text style={styles.genderEmoji}>{emoji}</Text>
                      <Text style={styles.genderLabel}>{label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 분위기 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              선호하는 분위기{' '}
              <Text style={styles.sectionSub}>(최대 3개)</Text>
            </Text>
            <View style={styles.vibesGrid}>
              {VIBES.map((vibe) => {
                const selected = selectedVibes.includes(vibe.label);
                return (
                  <TouchableOpacity
                    key={vibe.label}
                    onPress={() => toggleVibe(vibe.label)}
                    activeOpacity={0.8}
                    style={styles.vibeChipWrap}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={['#9810FA', '#E60076']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.vibeChip}
                      >
                        <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                        <Text style={[styles.vibeLabel, styles.vibeLabelSelected]}>
                          {vibe.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.vibeChip, styles.vibeChipUnselected]}>
                        <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                        <Text style={styles.vibeLabel}>{vibe.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 에러 */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 완료 버튼 */}
          <TouchableOpacity
            style={[styles.btn, (!canSubmit || loading) && { opacity: 0.5 }]}
            onPress={handleComplete}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
            />
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Vibly 시작하기</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing['2xl'],
  },

  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconWrap: {
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
  },

  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[800],
    marginBottom: Spacing.md,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    color: Colors.gray[400],
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.gray[900],
  },
  inputCount: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    marginRight: Spacing.sm,
  },
  checkBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#9810FA',
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#9810FA',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderChipWrap: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  genderChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
    borderRadius: BorderRadius.lg,
  },
  genderChipUnselected: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  genderEmoji: {
    fontSize: 20,
  },
  genderLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[700],
  },
  genderLabelSelected: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  vibeChipWrap: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 6,
    borderRadius: BorderRadius.full,
  },
  vibeChipUnselected: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  vibeEmoji: {
    fontSize: 16,
  },
  vibeLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[700],
  },
  vibeLabelSelected: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

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

  btn: {
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  btnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
