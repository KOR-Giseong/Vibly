import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, MapPin } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow, MOODS } from '@constants/theme';

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState('');
  const [memo, setMemo] = useState('');

  const canSubmit = !!selectedMood;

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing['4xl'] }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={22} color={Colors.gray[700]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>체크인</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Place Card */}
          <View style={styles.placeCard}>
            <View style={styles.placeIconWrap}>
              <Text style={{ fontSize: 24 }}>🏠</Text>
            </View>
            <View>
              <Text style={styles.placeName}>블루보틀 성수</Text>
              <View style={styles.addressRow}>
                <MapPin size={12} color={Colors.gray[400]} />
                <Text style={styles.addressText}>서울 성동구 성수일로 8-20</Text>
              </View>
            </View>
          </View>

          {/* Photo Upload */}
          <Text style={styles.label}>사진 추가 (선택)</Text>
          <TouchableOpacity style={styles.photoArea}>
            <Camera size={32} color={Colors.gray[400]} />
            <Text style={styles.photoText}>사진을 추가해보세요</Text>
            <Text style={styles.photoSub}>최대 3장</Text>
          </TouchableOpacity>

          {/* Mood */}
          <Text style={styles.label}>지금 기분은?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const isActive = selectedMood === mood.value;
              return (
                <TouchableOpacity
                  key={mood.value}
                  style={[styles.moodItem, isActive && styles.moodItemActive]}
                  onPress={() => setSelectedMood(mood.value)}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient colors={mood.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  )}
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, isActive && styles.moodLabelActive]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Memo */}
          <Text style={styles.label}>한마디 (선택)</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={4}
            placeholder="이 장소에서의 느낌을 기록해보세요..."
            placeholderTextColor={Colors.gray[400]}
            value={memo}
            onChangeText={setMemo}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            {canSubmit && (
              <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>체크인 완료</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['3xl'] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  placeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, marginBottom: Spacing['2xl'], ...Shadow.sm },
  placeIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  addressText: { fontSize: FontSize.xs, color: Colors.gray[500] },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: Spacing.md },
  photoArea: {
    borderWidth: 2, borderColor: Colors.gray[200], borderStyle: 'dashed',
    borderRadius: BorderRadius['2xl'], paddingVertical: Spacing['3xl'],
    alignItems: 'center', marginBottom: Spacing['2xl'],
  },
  photoText: { fontSize: FontSize.base, color: Colors.gray[500], marginTop: Spacing.sm },
  photoSub: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 4 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  moodItem: {
    width: '30.5%', paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl,
    alignItems: 'center', backgroundColor: Colors.white, overflow: 'hidden', ...Shadow.sm,
  },
  moodItemActive: {},
  moodEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  moodLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.gray[600] },
  moodLabelActive: { color: Colors.white },
  textarea: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    fontSize: FontSize.base, color: Colors.gray[900], minHeight: 100, marginBottom: Spacing['2xl'],
    ...Shadow.sm,
  },
  submitBtn: { borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.xl, alignItems: 'center', overflow: 'hidden' },
  submitDisabled: { backgroundColor: Colors.gray[200] },
  submitText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  submitTextDisabled: { color: Colors.gray[400] },
});
