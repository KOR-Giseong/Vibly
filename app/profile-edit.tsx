import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';
import { useQueryClient } from '@tanstack/react-query';

const VIBE_OPTIONS = [
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

const MAX_VIBES = 3;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [vibes, setVibes] = useState<string[]>(user?.preferredVibes ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setNickname(user.nickname ?? '');
      setVibes(user.preferredVibes ?? []);
    }
  }, [user]);

  const toggleVibe = (label: string) => {
    setVibes((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : prev.length < MAX_VIBES
          ? [...prev, label]
          : prev,
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('이름을 입력해주세요'); return; }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name: name.trim(), nickname: nickname.trim(), preferredVibes: vibes });
      setUser({ ...user!, ...updated });
      qc.invalidateQueries({ queryKey: ['user-stats'] });
      Alert.alert('저장 완료', '프로필이 업데이트됐어요!', [{ text: '확인', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('저장 실패', e?.response?.data?.message ?? '다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 편집</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 이름 */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력하세요"
                placeholderTextColor={Colors.gray[400]}
                maxLength={20}
              />
            </View>

            {/* 닉네임 */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요 (선택)"
                placeholderTextColor={Colors.gray[400]}
                maxLength={30}
                autoCapitalize="none"
              />
            </View>

            {/* 선호 바이브 */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.label}>선호 바이브</Text>
                <Text style={styles.labelSub}>{vibes.length}/{MAX_VIBES}</Text>
              </View>
              <View style={styles.vibeGrid}>
                {VIBE_OPTIONS.map(({ emoji, label }) => {
                  const selected = vibes.includes(label);
                  const disabled = !selected && vibes.length >= MAX_VIBES;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.vibePill, selected && styles.vibePillSelected, disabled && styles.vibePillDisabled]}
                      onPress={() => toggleVibe(label)}
                      activeOpacity={disabled ? 1 : 0.8}
                    >
                      <Text style={[styles.vibeEmoji, disabled && { opacity: 0.35 }]}>{emoji}</Text>
                      <Text style={[
                        styles.vibePillText,
                        selected && styles.vibePillTextSelected,
                        disabled && { color: Colors.gray[400] },
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={{ marginTop: Spacing['2xl'] }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={styles.saveBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>저장하기</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  backButton: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing['4xl'] },
  fieldGroup: {
    marginBottom: Spacing['5xl'],
  },
  label: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  labelSub: { fontSize: FontSize.xs, color: Colors.gray[400], fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSize.md, color: Colors.gray[900],
    borderWidth: 1, borderColor: Colors.gray[200], ...Shadow.sm,
  },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vibePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 9,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.gray[200], ...Shadow.sm,
  },
  vibePillSelected: { backgroundColor: Colors.primary[50], borderColor: Colors.primary[300] },
  vibePillDisabled: { opacity: 0.4 },
  vibeEmoji: { fontSize: 14 },
  vibePillText: { fontSize: FontSize.sm, color: Colors.gray[600], fontWeight: FontWeight.medium },
  vibePillTextSelected: { color: Colors.primary[600] },
  saveBtn: {
    borderRadius: BorderRadius.xl, paddingVertical: 16,
    alignItems: 'center', ...Shadow.md,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
