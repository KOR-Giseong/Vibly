/**
 * vibe-report.tsx
 * 바이브 리포트 스크린
 *
 * - 실제 API 연동 (주간 / 월간)
 * - 로딩 스켈레톤 · 에러 재시도 · 빈 상태 처리
 * - 애니메이션 바 차트 (Animated.spring)
 * - PullToRefresh · 공유하기 · 체크인 페이지 연동
 * - iOS / Android 호환
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Share2,
  BarChart2,
  RefreshCw,
  MapPin,
} from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { useVibeReport, usePrefetchVibeReport } from '@hooks/useVibeReport';
import type { DailyMoodEntry, VibeInsight } from '@/types';

type Period = 'weekly' | 'monthly';

// ─── 애니메이션 바 ────────────────────────────────────────────────────────────
function AnimatedBar({ percentage, color, delay = 0 }: { percentage: number; color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: percentage, delay, tension: 40, friction: 8, useNativeDriver: false }).start();
  }, [percentage]);
  return (
    <View style={barStyles.wrap}>
      <Animated.View style={[barStyles.fill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  wrap: { flex: 1, height: 10, backgroundColor: Colors.gray[100], borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});

// ─── 스켈레톤 카드 ────────────────────────────────────────────────────────────
function SkeletonCard({ height = 80 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[skeletonStyles.card, { height, opacity }]} />;
}
const skeletonStyles = StyleSheet.create({
  card: { backgroundColor: Colors.gray[200], borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
});

// ─── 섹션 타이틀 ──────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// ─── 주간 감정 여정 ───────────────────────────────────────────────────────────
function WeeklyMoodRow({ days }: { days: DailyMoodEntry[] }) {
  return (
    <View style={styles.weekRow}>
      {days.map((d) => (
        <View key={d.date} style={styles.dayItem}>
          <Text style={styles.dayText}>{d.dayLabel}</Text>
          <View style={[styles.dayEmojiWrap, d.checkInCount === 0 && styles.dayEmojiEmpty]}>
            <Text style={{ fontSize: 19 }}>{d.emoji ?? '–'}</Text>
          </View>
          <Text style={styles.dayCount}>{d.checkInCount > 0 ? `${d.checkInCount}회` : ''}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── 바이브 스코어 카드 ───────────────────────────────────────────────────────
function VibeScoreCard({ score }: { score: number }) {
  const label = score >= 90 ? '최고예요! 🚀' : score >= 75 ? '좋아요! 😊' : score >= 60 ? '보통이에요 😌' : '응원해요 💜';
  return (
    <View style={styles.overviewCard}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <Text style={styles.overviewLabel}>바이브 스코어</Text>
      <View style={styles.overviewRow}>
        <Text style={styles.overviewScore}>{score}</Text>
        <View style={styles.trendBadge}>
          <TrendingUp size={12} color={Colors.white} />
          <Text style={styles.trendText}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── 인사이트 카드 ────────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: VibeInsight }) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDesc}>{insight.desc}</Text>
      </View>
    </View>
  );
}


// ─── 메인 스크린 ──────────────────────────────────────────────────────────────
export default function VibeReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('weekly');
  const prefetch = usePrefetchVibeReport();

  const { data, isLoading, isError, refetch, isRefetching } = useVibeReport(period);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    prefetch(p === 'weekly' ? 'monthly' : 'weekly');
  };

  const handleShare = useCallback(async () => {
    if (!data) return;
    try {
      const lines = [
        `📊 바이브 리포트 (${data.period === 'weekly' ? '주간' : '월간'})`,
        `📅 ${data.dateRange}`,
        `✅ 체크인: ${data.checkInCount}회`,
        `🗺️ 방문 장소: ${data.uniquePlacesCount}곳`,
        data.vibeScore > 0 ? `⭐ 바이브 스코어: ${data.vibeScore}점` : '',
        '\n— Vibly로 기록 중 🌟',
      ].filter(Boolean);
      await Share.share({ message: lines.join('\n') });
    } catch { /* 취소 */ }
  }, [data]);

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>바이브 리포트</Text>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn} disabled={!data}>
            <Share2 size={20} color={data ? Colors.gray[700] : Colors.gray[300]} />
          </TouchableOpacity>
        </View>

        {/* 기간 토글 */}
        <View style={styles.toggleWrap}>
          {(['weekly', 'monthly'] as Period[]).map((p) => (
            <TouchableOpacity key={p} style={[styles.toggleBtn, period === p && styles.toggleActive]} onPress={() => handlePeriodChange(p)} activeOpacity={0.8}>
              {period === p && <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                {p === 'weekly' ? '주간' : '월간'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
        >
          {/* 날짜 범위 */}
          <View style={styles.dateCard}>
            <Calendar size={15} color={Colors.primary[600]} />
            <Text style={styles.dateText}>{isLoading ? '불러오는 중…' : data?.dateRange ?? ''}</Text>
          </View>

          {/* 로딩 스켈레톤 */}
          {isLoading && (
            <>
              <SkeletonCard height={115} />
              <SkeletonCard height={80} />
              <SkeletonCard height={160} />
              <SkeletonCard height={200} />
            </>
          )}

          {/* 에러 상태 */}
          {isError && !isLoading && (
            <View style={styles.centerBox}>
              <Text style={styles.stateEmoji}>⚠️</Text>
              <Text style={styles.stateTitle}>데이터를 불러오지 못했어요</Text>
              <Text style={styles.stateDesc}>네트워크를 확인하고 다시 시도해주세요.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => refetch()} activeOpacity={0.85}>
                <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.actionBtnText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 빈 상태 */}
          {!isLoading && !isError && data && data.checkInCount === 0 && (
            <View style={styles.centerBox}>
              <Text style={styles.stateEmoji}>📍</Text>
              <Text style={styles.stateTitle}>{period === 'weekly' ? '이번 주' : '이번 달'} 체크인이 없어요</Text>
              <Text style={styles.stateDesc}>장소에 체크인하면 바이브 리포트가 만들어져요!</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
                <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <MapPin size={16} color={Colors.white} />
                <Text style={styles.actionBtnText}>장소 찾으러 가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 실제 리포트 데이터 */}
          {!isLoading && !isError && data && data.checkInCount > 0 && (
            <>
              {/* 주간 전용 */}
              {period === 'weekly' && data.dailyMoods.length > 0 && (
                <>
                  <SectionTitle>이번 주 감정 여정</SectionTitle>
                  <WeeklyMoodRow days={data.dailyMoods} />
                  <View style={styles.statsRow}>
                    {[
                      { value: String(data.checkInCount),      label: '체크인' },
                      { value: String(data.uniquePlacesCount),  label: '방문 장소' },
                      { value: String(data.reviewCount),        label: '리뷰' },
                    ].map((s) => (
                      <View key={s.label} style={styles.statCard}>
                        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* 월간 전용 */}
              {period === 'monthly' && (
                <>
                  <VibeScoreCard score={data.vibeScore} />
                  {data.emotionDistribution.length > 0 && (
                    <>
                      <SectionTitle>감정 분포</SectionTitle>
                      {data.emotionDistribution.map((e, i) => (
                        <View key={e.mood} style={styles.barRow}>
                          <Text style={styles.barLabel}>{e.emoji} {e.label}</Text>
                          <AnimatedBar percentage={e.percentage} color={e.color} delay={i * 80} />
                          <Text style={styles.barPct}>{e.percentage}%</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Top 바이브 (공통) */}
              {data.topCategories.length > 0 && (
                <>
                  <SectionTitle>Top 바이브</SectionTitle>
                  {data.topCategories.map((v, i) => (
                    <View key={v.category} style={styles.barRow}>
                      <Text style={styles.barLabel}>{v.label}</Text>
                      <AnimatedBar percentage={v.percentage} color={v.color} delay={i * 80} />
                      <Text style={styles.barPct}>{v.percentage}%</Text>
                    </View>
                  ))}
                </>
              )}

              {/* 인사이트 (공통) */}
              {data.insights.length > 0 && (
                <>
                  <SectionTitle>인사이트</SectionTitle>
                  {data.insights.map((ins) => (
                    <InsightCard key={ins.title} insight={ins} />
                  ))}
                </>
              )}

              {/* CTA: 내 체크인 기록 보기 */}
              <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/my-checkins')} activeOpacity={0.85}>
                <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <BarChart2 size={18} color={Colors.white} />
                <Text style={styles.ctaText}>내 체크인 기록 보기</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
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
  // 주간 무드
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing['2xl'] },
  dayItem: { alignItems: 'center', gap: Spacing.xs },
  dayText: { fontSize: FontSize.xs, color: Colors.gray[500], fontWeight: FontWeight.medium },
  dayEmojiWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  dayEmojiEmpty: { backgroundColor: Colors.gray[100] },
  dayCount: { fontSize: 9, color: Colors.gray[400] },
  // 스탯 카드
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  statCard: { flex: 1, alignItems: 'center', borderRadius: BorderRadius.xl, paddingVertical: Spacing.xl, overflow: 'hidden' },
  statValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // 바이브 스코어
  overviewCard: { borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], overflow: 'hidden', marginBottom: Spacing['2xl'] },
  overviewLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  overviewScore: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: Colors.white },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, gap: 4 },
  trendText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semibold },
  // 바 차트 행
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  barLabel: { width: 76, fontSize: FontSize.sm, color: Colors.gray[700] },
  barPct: { width: 36, fontSize: FontSize.sm, color: Colors.gray[600], textAlign: 'right' },
  // 인사이트 카드
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  insightEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  insightTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: 4 },
  insightDesc: { fontSize: FontSize.sm, color: Colors.gray[500], lineHeight: 20 },
  // 에러/빈 상태
  centerBox: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  stateEmoji: { fontSize: 52, marginBottom: Spacing.lg },
  stateTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[800], marginBottom: Spacing.sm, textAlign: 'center' },
  stateDesc: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 20, paddingHorizontal: Spacing.xl },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full, overflow: 'hidden', paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md },
  actionBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
  // CTA
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.xl, overflow: 'hidden', paddingVertical: Spacing.lg, marginTop: Spacing['2xl'] },
  ctaText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
});
