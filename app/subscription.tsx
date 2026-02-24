import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Crown, Check, Shield, Zap, BarChart2, Tag, Brain, Ban } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow, SUBSCRIPTION_PLANS } from '@constants/theme';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  { icon: Zap,      text: '무제한 AI 추천'          },
  { icon: BarChart2,text: '프리미엄 바이브 리포트'   },
  { icon: Crown,    text: '우선 예약'               },
  { icon: Tag,      text: '파트너 할인 혜택'         },
  { icon: Brain,    text: '상세 감정 분석'            },
  { icon: Ban,      text: '광고 없는 경험'            },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>('yearly');

  const currentPlan = SUBSCRIPTION_PLANS[plan];

  return (
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
          <Text style={styles.heroSub}>감정 기반 장소 탐험의 모든 것을{'\n'}무제한으로 경험하세요</Text>
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
          {'badge' in currentPlan && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{(currentPlan as typeof SUBSCRIPTION_PLANS.yearly).badge}</Text>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon size={16} color={Colors.primary[600]} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
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
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Crown size={20} color={Colors.white} />
          <Text style={styles.ctaBtnText}>지금 시작하기</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  featureText: { flex: 1, fontSize: FontSize.base, color: Colors.gray[700], fontWeight: FontWeight.medium },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  securityText: { fontSize: FontSize.xs, color: Colors.gray[400] },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.xl, overflow: 'hidden' },
  ctaBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
});
