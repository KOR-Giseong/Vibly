import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Crown, Check, Shield, Zap, BarChart2, Image, MapPin, Star, MessageCircle, Sparkles, Ban } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow, SUBSCRIPTION_PLANS } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { useCreditStore } from '@stores/credit.store';
import { creditService } from '@services/credit.service';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  { icon: Zap,          text: 'AI 기분 검색 무제한',        desc: '크레딧 소모 없이 무제한 검색' },
  { icon: Star,         text: 'AI 데이트 플랜 분석 무제한', desc: '크레딧 없이 AI 분석 무제한' },
  { icon: Image,        text: '추억 사진 무제한 업로드',    desc: '무료 100장 → 무제한' },
  { icon: MapPin,       text: '검색 반경 최대 10km',        desc: '무료 3km → 최대 10km' },
  { icon: BarChart2,    text: '월간 바이브 리포트',          desc: '무료 주간 → 주간 + 월간' },
  { icon: Sparkles,     text: 'AI 리뷰 요약',               desc: '장소 상세에서 AI 리뷰 분석' },
  { icon: Zap,          text: '실시간 상황 기반 추천',       desc: '날씨·시간 기반 장소 추천' },
  { icon: MessageCircle,text: 'AI 대화형 데이트 비서',       desc: '커플 전용 AI 채팅 비서' },
  { icon: Ban,          text: '광고 없는 경험',              desc: '모든 광고 제거' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, syncBalance } = useCreditStore();

  const handleSubscribe = () => {
    Alert.alert('업데이트 예정', '인앱결제 기능은 현재 업데이트 중입니다.\n곧 만나보실 수 있어요! 😊', [
      { text: '확인' },
    ]);
  };

  const handleCancel = () => {
    Alert.alert(
      '구독 취소',
      '정말로 구독을 취소하시겠어요?\n취소 후에는 프리미엄 기능을 사용할 수 없어요.',
      [
        { text: '유지하기', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await creditService.cancelSubscription();
              await syncBalance();
              Alert.alert('구독 취소 완료', '구독이 취소되었어요. 프리미엄 혜택이 종료됩니다.', [
                { text: '확인', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('오류', '구독 취소 중 오류가 발생했어요. 다시 시도해주세요.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const currentPlan = SUBSCRIPTION_PLANS[plan];

  return (
    <ScreenTransition>
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={Gradients.primary} style={styles.crownCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Crown size={40} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Vibly Premium</Text>
          <Text style={styles.heroSub}>감정 기반 장소 탐험의 모든 것을{'\n'}무제한으로 경험하세요.</Text>
        </View>

        {/* Plan Toggle */}
        <View style={styles.planRow}>
          {(['monthly', 'yearly'] as Plan[]).map((p) => (
            <TouchableOpacity key={p} style={[styles.planBtn, plan === p && styles.planBtnActive]} onPress={() => setPlan(p)} activeOpacity={0.8}>
              {plan === p && <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
              {p === 'yearly' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>인기</Text>
                </View>
              )}
              <Text style={[styles.planBtnText, plan === p && styles.planBtnTextActive]}>
                {SUBSCRIPTION_PLANS[p].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>₩</Text>
            <Text style={styles.priceNumber}>{currentPlan.price.replace('₩', '').replace(',', '')}</Text>
            <Text style={styles.pricePeriod}>/{currentPlan.period}</Text>
          </View>
          <Text style={styles.priceTotal}>{currentPlan.total}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map(({ icon: Icon, text, desc }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon size={16} color={Colors.primary[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureText}>{text}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
              </View>
              <Check size={16} color={Colors.primary[600]} />
            </View>
          ))}
        </View>

        {/* Security */}
        <View style={styles.securityRow}>
          <Shield size={14} color={Colors.gray[400]} />
          <Text style={styles.securityText}>언제든지 취소 가능 · 안전한 결제</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + Spacing.md }]}>
        {isPremium ? (
          <>
            <View style={[styles.activeBadge]}>
              <Crown size={16} color={Colors.primary[600]} />
              <Text style={styles.activeBadgeText}>현재 프리미엄 구독 중</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText}>{isLoading ? '처리 중...' : '구독 취소하기'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.ctaBtn, isLoading && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSubscribe} disabled={isLoading}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Crown size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>{isLoading ? '처리 중...' : '지금 시작하기'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  hero: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  crownCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  heroTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.gray[900], marginBottom: Spacing.sm },
  heroSub: { fontSize: FontSize.base, color: Colors.gray[500], textAlign: 'center', lineHeight: 22 },
  planRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  planBtn: { flex: 1, paddingVertical: Spacing.xl, alignItems: 'center', borderRadius: BorderRadius['2xl'], backgroundColor: Colors.white, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.gray[200] },
  planBtnActive: { borderColor: 'transparent' },
  popularBadge: { position: 'absolute', top: -1, right: 12, backgroundColor: Colors.pink[500], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  popularText: { fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold },
  planBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[600] },
  planBtnTextActive: { color: Colors.white },
  priceCard: { alignItems: 'center', borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], overflow: 'hidden', marginBottom: Spacing.xl, ...Shadow.lg },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  priceSymbol: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, paddingBottom: 6 },
  priceNumber: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: Colors.white },
  pricePeriod: { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.8)', paddingBottom: 6 },
  priceTotal: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  discountBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, marginTop: Spacing.sm },
  discountText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.bold },
  featuresCard: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[50] },
  featureIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  featureText: { fontSize: FontSize.base, color: Colors.gray[700], fontWeight: FontWeight.medium },
  featureDesc: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 1 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  securityText: { fontSize: FontSize.xs, color: Colors.gray[400] },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.xl, overflow: 'hidden' },
  ctaBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  activeBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary[50], borderRadius: BorderRadius.xl, paddingVertical: Spacing.md, marginBottom: Spacing.sm },
  activeBadgeText: { fontSize: FontSize.sm, color: Colors.primary[600], fontWeight: FontWeight.semibold },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  cancelBtnText: { fontSize: FontSize.sm, color: Colors.gray[400], textDecorationLine: 'underline' },
});
