import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import * as Application from 'expo-application';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Coins, Crown, Tv, CheckCircle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { useCreditStore } from '@stores/credit.store';
import { creditService } from '@services/credit.service';
import type { CreditTransaction } from '@services/credit.service';

const TX_LABEL: Record<string, { label: string; sign: string; color: string }> = {
  SIGNUP_BONUS:      { label: '가입 보너스',      sign: '+', color: '#10B981' },
  MOOD_SEARCH_BASIC: { label: '감정 검색',         sign: '-', color: '#EF4444' },
  MOOD_SEARCH_AI:    { label: 'AI 분석 검색',      sign: '-', color: '#EF4444' },
  CHECKIN_GPS:       { label: 'GPS 체크인 보상',   sign: '+', color: '#10B981' },
  CHECKIN_RECEIPT:   { label: '영수증 체크인 보상', sign: '+', color: '#10B981' },
  AD_WATCH:          { label: '광고 시청 보상',    sign: '+', color: '#10B981' },
  ADMIN_GRANT:       { label: '관리자 지급',       sign: '+', color: '#10B981' },
};

const PROD_AD_ID = Platform.select({
  ios: 'ca-app-pub-4793069997129951/7684070668',
  android: 'ca-app-pub-4793069997129951/3387255513',
})!;

// 광고 ID는 앱 생애 주기 동안 한 번만 결정 (ref에 캐시)
async function resolveAdUnitId(): Promise<string> {
  if (__DEV__) return TestIds.REWARDED;
  if (Platform.OS === 'ios') {
    try {
      const type = await Application.getIosApplicationReleaseTypeAsync();
      if (type === Application.ApplicationReleaseType.TESTFLIGHT) return TestIds.REWARDED;
    } catch {
      // 감지 실패 시 안전하게 테스트 광고 사용
      return TestIds.REWARDED;
    }
  }
  return PROD_AD_ID;
}

const MAX_AD_RETRIES = 3;

export default function CreditsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { credits, isPremium, syncBalance } = useCreditStore();
  const [adWatchedToday, setAdWatchedToday] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adLoading, setAdLoading] = useState(true); // 초기엔 로딩 중
  const [adFailed, setAdFailed] = useState(false);  // 3회 실패 시 true

  // 광고 관련 ref (재렌더 없이 참조)
  const adUnitIdRef = useRef<string | null>(null);
  const adRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const retryCountRef = useRef(0);
  const unsubsRef = useRef<(() => void)[]>([]);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAd = useCallback(() => {
    if (!adUnitIdRef.current) return;
    if (retryCountRef.current >= MAX_AD_RETRIES) {
      setAdFailed(true);
      setAdLoading(false);
      return;
    }

    // 이전 광고 리스너 & 타임아웃 정리
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    unsubsRef.current.forEach((fn) => fn());
    unsubsRef.current = [];

    const ad = RewardedAd.createForAdRequest(adUnitIdRef.current, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    setAdLoaded(false);
    setAdLoading(true);
    setAdFailed(false);

    // 15초 안에 LOADED/ERROR 이벤트가 없으면 실패로 처리
    loadTimeoutRef.current = setTimeout(() => {
      if (!adRef.current) return;
      retryCountRef.current += 1;
      setAdLoaded(false);
      if (retryCountRef.current >= MAX_AD_RETRIES) {
        setAdFailed(true);
        setAdLoading(false);
      } else {
        loadAd();
      }
    }, 15000);

    unsubsRef.current.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        retryCountRef.current = 0; // 성공 시 재시도 카운트 초기화
        setAdLoaded(true);
        setAdLoading(false);
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        watchAdMutation.mutate();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdLoaded(false);
        setAdLoading(true);
        // 광고 닫힘 → 다음 광고 준비
        setTimeout(() => loadAd(), 500);
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        retryCountRef.current += 1;
        setAdLoaded(false);
        if (retryCountRef.current >= MAX_AD_RETRIES) {
          setAdFailed(true);
          setAdLoading(false);
        } else {
          // 3초 후 재시도
          setTimeout(() => loadAd(), 3000);
        }
      }),
    );

    ad.load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마운트 시 광고 ID 결정 후 로드 시작
  useEffect(() => {
    resolveAdUnitId().then((id) => {
      adUnitIdRef.current = id;
      loadAd();
    });
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      unsubsRef.current.forEach((fn) => fn());
    };
  }, [loadAd]);

  // 오늘 광고 시청 횟수
  const { data: adData } = useQuery({
    queryKey: ['ad-watches-today'],
    queryFn: creditService.getAdWatchesToday,
    staleTime: 0,
  });

  useEffect(() => {
    if (adData) setAdWatchedToday(adData.adWatchesToday);
  }, [adData]);

  // 크레딧 내역
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => creditService.getHistory(1),
  });

  // 광고 시청
  const watchAdMutation = useMutation({
    mutationFn: creditService.watchAd,
    onSuccess: (data) => {
      syncBalance();
      setAdWatchedToday((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
      Alert.alert('🎉 크레딧 획득!', `광고 시청으로 ${data.earned} 크레딧을 받았어요.\n현재 잔액: ${data.credits} 크레딧`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? '광고 시청 처리 중 오류가 났어요.';
      Alert.alert('알림', msg);
    },
  });

  const handleWatchAd = useCallback(() => {
    if (adWatchedToday >= 5) {
      Alert.alert('오늘 한도 초과', '광고 시청은 하루 5번까지만 가능해요. 내일 다시 시도해주세요.');
      return;
    }
    if (adFailed) {
      retryCountRef.current = 0;
      loadAd();
      return;
    }
    if (!adLoaded) {
      Alert.alert('광고 준비 중', '광고를 불러오고 있어요. 잠시 후 다시 탭해주세요.');
      return;
    }
    adRef.current?.show();
  }, [adWatchedToday, adLoaded, adFailed, loadAd]);

  const handleSubscribe = () => {
    Alert.alert('구독', '구독 기능은 준비 중이에요. 곧 출시될 예정이에요! 🚀');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={['#FAF5FF', '#FFF7ED', '#FFFFFF']} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>크레딧</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* ── 잔액 카드 ── */}
        <View style={styles.balanceCard}>
          {isPremium ? (
            <>
              <Crown size={32} color="#7C3AED" />
              <Text style={styles.balanceLabel}>구독 중</Text>
              <Text style={styles.premiumDesc}>무제한 검색이 가능해요.</Text>
            </>
          ) : (
            <>
              <Coins size={32} color="#F59E0B" />
              <Text style={styles.balanceLabel}>보유 크레딧</Text>
              <Text style={styles.balanceAmount}>{credits.toLocaleString()}</Text>
              <Text style={styles.balanceDesc}>기본 검색 5 / AI 검색 10 소모</Text>
            </>
          )}
        </View>

        {/* ── 크레딧 획득 방법 ── */}
        <Text style={styles.sectionTitle}>크레딧 충전</Text>

        {/* 광고 시청 */}
        <TouchableOpacity
          style={styles.rechargeCard}
          onPress={handleWatchAd}
          activeOpacity={0.75}
          disabled={watchAdMutation.isPending || (adLoading && !adFailed) || adWatchedToday >= 5}
        >
          <View style={[styles.rechargeIcon, { backgroundColor: '#FEF3C7' }]}>
            <Tv size={22} color="#D97706" />
          </View>
          <View style={styles.rechargeInfo}>
            <Text style={styles.rechargeTitle}>광고 시청</Text>
            <Text style={styles.rechargeDesc}>+15 크레딧 · 오늘 {adWatchedToday}/5회</Text>
          </View>
          {watchAdMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : adWatchedToday >= 5 ? (
            <View style={styles.adDoneTag}>
              <Text style={styles.adDoneText}>내일 가능</Text>
            </View>
          ) : adFailed ? (
            <View style={[styles.adEarnTag, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.adEarnText, { color: '#EF4444' }]}>재시도</Text>
            </View>
          ) : adLoading ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : adLoaded ? (
            <View style={styles.adEarnTag}>
              <Text style={styles.adEarnText}>+15</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* 체크인 안내 */}
        <View style={[styles.rechargeCard, { opacity: 0.8 }]}>
          <View style={[styles.rechargeIcon, { backgroundColor: '#D1FAE5' }]}>
            <CheckCircle size={22} color="#059669" />
          </View>
          <View style={styles.rechargeInfo}>
            <Text style={styles.rechargeTitle}>장소 체크인</Text>
            <Text style={styles.rechargeDesc}>GPS +15 / 영수증 +20 크레딧</Text>
          </View>
          <View style={styles.adEarnTag}>
            <Text style={styles.adEarnText}>+15~20</Text>
          </View>
        </View>

        {/* 구독 */}
        {!isPremium && (
          <TouchableOpacity style={styles.subscribeCard} onPress={handleSubscribe} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED', '#9810FA']} style={styles.subscribeGradient}>
              <Crown size={20} color="#FFF" />
              <View style={styles.subscribeInfo}>
                <Text style={styles.subscribeTitle}>구독하기</Text>
                <Text style={styles.subscribeDesc}>무제한 검색 · 광고 없음 · 더 많은 혜택</Text>
              </View>
              <Text style={styles.subscribePrepare}>준비 중</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── 크레딧 내역 ── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing['2xl'] }]}>크레딧 내역</Text>

        {historyLoading ? (
          <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 20 }} />
        ) : !historyData?.items.length ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>아직 크레딧 내역이 없어요</Text>
          </View>
        ) : (
          historyData.items.map((tx: CreditTransaction) => {
            const meta = TX_LABEL[tx.type] ?? { label: tx.type, sign: tx.amount > 0 ? '+' : '-', color: '#6B7280' };
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txLabel}>{meta.label}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: meta.color }]}>
                  {meta.sign}{Math.abs(tx.amount)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },

  balanceCard: {
    margin: Spacing['2xl'],
    padding: Spacing['2xl'],
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  balanceLabel: { fontSize: FontSize.sm, color: Colors.gray[500], fontWeight: FontWeight.medium },
  balanceAmount: { fontSize: 40, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  balanceDesc: { fontSize: FontSize.xs, color: Colors.gray[400] },
  premiumDesc: { fontSize: FontSize.sm, color: '#7C3AED', fontWeight: FontWeight.medium },

  sectionTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold,
    color: Colors.gray[800], paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.sm,
  },

  rechargeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.sm,
    borderRadius: 16, padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm,
  },
  rechargeIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  rechargeInfo: { flex: 1 },
  rechargeTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900] },
  rechargeDesc: { fontSize: FontSize.xs, color: Colors.gray[500], marginTop: 2 },
  adEarnTag: {
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  adEarnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#059669' },
  adDoneTag: {
    backgroundColor: Colors.gray[100], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  adDoneText: { fontSize: FontSize.xs, color: Colors.gray[400] },

  subscribeCard: {
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.sm, borderRadius: 16, overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md,
  },
  subscribeInfo: { flex: 1 },
  subscribeTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  subscribeDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  subscribePrepare: {
    fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },

  txRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  txLeft: { gap: 2 },
  txLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[800] },
  txDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  txAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  emptyHistory: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  emptyHistoryText: { fontSize: FontSize.sm, color: Colors.gray[400] },
});
