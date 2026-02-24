import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

type Period = 'weekly' | 'monthly';

const WEEKLY_MOODS = [
  { day: '월', emoji: '😊', label: '행복' },
  { day: '화', emoji: '😌', label: '평온' },
  { day: '수', emoji: '💭', label: '생각' },
  { day: '목', emoji: '🥳', label: '신남' },
  { day: '금', emoji: '🔥', label: '열정' },
  { day: '토', emoji: '😊', label: '행복' },
  { day: '일', emoji: '😌', label: '평온' },
];

const TOP_VIBES = [
  { label: '아늑한', value: 85, color: Colors.primary[600] },
  { label: '평화로운', value: 72, color: '#2563EB' },
  { label: '감성적', value: 60, color: Colors.pink[600] },
];

const INSIGHTS = [
  { emoji: '☕', title: '카페를 가장 많이 방문', desc: '이번 주 방문의 60%가 카페였어요. 아늑한 공간을 좋아하시는군요!' },
  { emoji: '🌙', title: '저녁 시간대에 활발', desc: '오후 7-9시에 가장 많은 체크인이 있었어요' },
  { emoji: '📍', title: '성수동이 단골 지역', desc: '이번 주 성수동을 3회 방문했어요' },
];

const MONTHLY_EMOTIONS = [
  { label: '행복함', value: 45, color: '#FACC15' },
  { label: '평화로움', value: 30, color: '#60A5FA' },
  { label: '신남', value: 15, color: '#F472B6' },
  { label: '기타', value: 10, color: Colors.gray[300] },
];

export default function VibeReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('weekly');

  return (
    <ScreenTransition>
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>바이브 리포트</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Toggle */}
      <View style={styles.toggleWrap}>
        {(['weekly', 'monthly'] as Period[]).map((p) => (
          <TouchableOpacity key={p} style={[styles.toggleBtn, period === p && styles.toggleActive]} onPress={() => setPeriod(p)}>
            {period === p && <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {p === 'weekly' ? '주간' : '월간'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        {/* Date Range */}
        <View style={styles.dateCard}>
          <Calendar size={16} color={Colors.primary[600]} />
          <Text style={styles.dateText}>
            {period === 'weekly' ? '2025년 1월 13일 - 19일' : '2025년 1월'}
          </Text>
        </View>

        {period === 'weekly' ? (
          <>
            {/* Weekly Moods */}
            <Text style={styles.sectionTitle}>이번 주 감정 여정</Text>
            <View style={styles.weekRow}>
              {WEEKLY_MOODS.map(({ day, emoji, label }) => (
                <View key={day} style={styles.dayItem}>
                  <Text style={styles.dayText}>{day}</Text>
                  <View style={styles.dayEmojiWrap}><Text style={{ fontSize: 22 }}>{emoji}</Text></View>
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[{ value: '24', label: '체크인' }, { value: '12', label: '새 장소' }, { value: '8', label: '리뷰' }].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Monthly Overview */}
            <View style={styles.overviewCard}>
              <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View>
                <Text style={styles.overviewLabel}>바이브 스코어</Text>
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewScore}>87</Text>
                  <View style={styles.trendBadge}>
                    <TrendingUp size={12} color={Colors.white} />
                    <Text style={styles.trendText}>+12</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Emotion Chart */}
            <Text style={styles.sectionTitle}>감정 분포</Text>
            {MONTHLY_EMOTIONS.map((e) => (
              <View key={e.label} style={styles.emotionRow}>
                <Text style={styles.emotionLabel}>{e.label}</Text>
                <View style={styles.barWrap}>
                  <View style={[styles.barFill, { width: `${e.value}%`, backgroundColor: e.color }]} />
                </View>
                <Text style={styles.emotionPct}>{e.value}%</Text>
              </View>
            ))}
          </>
        )}

        {/* Top Vibes */}
        <Text style={styles.sectionTitle}>Top 바이브</Text>
        {TOP_VIBES.map((v) => (
          <View key={v.label} style={styles.vibeRow}>
            <Text style={styles.vibeLabel}>{v.label}</Text>
            <View style={styles.vibeBarWrap}>
              <View style={[styles.vibeBarFill, { width: `${v.value}%`, backgroundColor: v.color }]} />
            </View>
            <Text style={styles.vibeValue}>{v.value}%</Text>
          </View>
        ))}

        {/* Insights */}
        <Text style={styles.sectionTitle}>인사이트</Text>
        {INSIGHTS.map((ins) => (
          <View key={ins.title} style={styles.insightCard}>
            <Text style={styles.insightEmoji}>{ins.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>{ins.title}</Text>
              <Text style={styles.insightDesc}>{ins.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  toggleWrap: { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: BorderRadius.lg, padding: 4, marginHorizontal: Spacing['2xl'], marginBottom: Spacing.lg },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md, overflow: 'hidden' },
  toggleActive: {},
  toggleText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.gray[500] },
  toggleTextActive: { color: Colors.white },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xl },
  dateText: { fontSize: FontSize.sm, color: Colors.primary[700], fontWeight: FontWeight.medium },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: Spacing.lg, marginTop: Spacing.sm },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing['2xl'] },
  dayItem: { alignItems: 'center', gap: Spacing.xs },
  dayText: { fontSize: FontSize.xs, color: Colors.gray[500], fontWeight: FontWeight.medium },
  dayEmojiWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  dayLabel: { fontSize: 9, color: Colors.gray[500] },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  statCard: { flex: 1, alignItems: 'center', borderRadius: BorderRadius.xl, paddingVertical: Spacing.xl, overflow: 'hidden' },
  statValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  overviewCard: { borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], overflow: 'hidden', marginBottom: Spacing['2xl'] },
  overviewLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  overviewScore: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: Colors.white },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, gap: 2 },
  trendText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.bold },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  emotionLabel: { width: 56, fontSize: FontSize.sm, color: Colors.gray[700] },
  barWrap: { flex: 1, height: 10, backgroundColor: Colors.gray[100], borderRadius: 5 },
  barFill: { height: '100%', borderRadius: 5 },
  emotionPct: { width: 36, fontSize: FontSize.sm, color: Colors.gray[600], textAlign: 'right' },
  vibeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  vibeLabel: { width: 60, fontSize: FontSize.sm, color: Colors.gray[700] },
  vibeBarWrap: { flex: 1, height: 10, backgroundColor: Colors.gray[100], borderRadius: 5 },
  vibeBarFill: { height: '100%', borderRadius: 5 },
  vibeValue: { width: 36, fontSize: FontSize.sm, color: Colors.gray[600], textAlign: 'right' },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  insightEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  insightTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: 4 },
  insightDesc: { fontSize: FontSize.sm, color: Colors.gray[500], lineHeight: 20 },
});
