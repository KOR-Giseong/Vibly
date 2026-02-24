import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Heart, MapPin, Clock, Phone, Star, Users, Navigation } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

const MOCK_PLACE = {
  id: '1',
  name: '블루보틀 성수',
  category: '카페',
  rating: 4.8,
  reviewCount: 127,
  vibeScore: 95,
  vibes: ['아늑한', '감성적', '조용한'],
  address: '서울 성동구 성수일로 8-20',
  hours: '오전 8:00 - 오후 9:00 · 영업중',
  phone: '02-1234-5678',
  description: '성수동 특유의 빈티지 감성과 스페셜티 커피가 조화롭게 어우러진 공간입니다. 넓은 창문으로 들어오는 자연광이 아늑한 분위기를 만들어줍니다.',
  emotions: [
    { label: '아늑함', value: 92 },
    { label: '행복함', value: 88 },
    { label: '평화로움', value: 85 },
  ],
  reasons: [
    { emoji: '☕', title: '완벽한 스페셜티 커피', desc: 'AI가 분석한 리뷰에서 커피 품질에 대한 극찬이 가장 많았어요' },
    { emoji: '🌿', title: '힐링되는 인테리어', desc: '자연광과 그린 인테리어가 감성적인 분위기를 연출해요' },
    { emoji: '🔇', title: '조용한 분위기', desc: '작업하기 좋은 잔잔한 BGM과 적당한 소음 수준을 유지해요' },
  ],
};

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [liked, setLiked] = useState(false);

  const place = MOCK_PLACE;

  return (
    <ScreenTransition>
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.hero}>
          <LinearGradient colors={['#7C3AED', '#DB2777']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} />
          <Text style={styles.heroEmoji}>🏠</Text>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.heroOverlay} />
        </View>

        {/* Floating Buttons */}
        <View style={[styles.floatBtns, { top: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.floatRight}>
            <TouchableOpacity style={styles.floatBtn}>
              <Share2 size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatBtn} onPress={() => setLiked(!liked)}>
              <Heart size={20} color={liked ? '#EF4444' : Colors.white} fill={liked ? '#EF4444' : 'transparent'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeCategory}>{place.category}</Text>
            </View>
            <View style={styles.ratingWrap}>
              <Star size={14} color="#FACC15" fill="#FACC15" />
              <Text style={styles.ratingText}>{place.rating}</Text>
            </View>
          </View>

          {/* Vibe Tags */}
          <View style={styles.vibesRow}>
            {place.vibes.map((v) => (
              <View key={v} style={styles.vibeTag}>
                <Text style={styles.vibeTagText}>{v}</Text>
              </View>
            ))}
          </View>

          {/* AI Vibe Score */}
          <View style={styles.scoreCard}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>AI 바이브 스코어</Text>
              {place.emotions.map((e) => (
                <View key={e.label} style={styles.emotionRow}>
                  <Text style={styles.emotionLabel}>{e.label}</Text>
                  <View style={styles.emotionBar}>
                    <View style={[styles.emotionFill, { width: `${e.value}%` }]} />
                  </View>
                  <Text style={styles.emotionValue}>{e.value}%</Text>
                </View>
              ))}
            </View>
            <Text style={styles.bigScore}>{place.vibeScore}</Text>
          </View>

          {/* Reasons */}
          <Text style={styles.sectionTitle}>추천 이유</Text>
          {place.reasons.map((r) => (
            <View key={r.title} style={styles.reasonCard}>
              <View style={styles.reasonIcon}>
                <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reasonTitle}>{r.title}</Text>
                <Text style={styles.reasonDesc}>{r.desc}</Text>
              </View>
            </View>
          ))}

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <Users size={16} color={Colors.primary[600]} />
            <Text style={styles.socialText}>{place.reviewCount}명이 방문했어요</Text>
          </View>

          {/* Info Cards */}
          <Text style={styles.sectionTitle}>장소 정보</Text>
          {[
            { icon: MapPin,  text: place.address },
            { icon: Clock,   text: place.hours   },
            { icon: Phone,   text: place.phone    },
          ].map(({ icon: Icon, text }) => (
            <View key={text} style={styles.infoCard}>
              <Icon size={16} color={Colors.primary[600]} />
              <Text style={styles.infoText}>{text}</Text>
            </View>
          ))}

          {/* Description */}
          <Text style={styles.description}>{place.description}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.navBtn} activeOpacity={0.85}>
          <Navigation size={18} color={Colors.primary[600]} />
          <Text style={styles.navBtnText}>길찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkinBtn} onPress={() => router.push('/checkin')} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Text style={styles.checkinBtnText}>체크인</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  hero: { height: 300, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 80 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  floatBtns: { position: 'absolute', left: Spacing['2xl'], right: Spacing['2xl'], flexDirection: 'row', justifyContent: 'space-between' },
  floatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  floatRight: { flexDirection: 'row', gap: Spacing.sm },
  content: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], marginTop: -32, padding: Spacing['2xl'] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  placeName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  placeCategory: { fontSize: FontSize.sm, color: Colors.gray[500], marginTop: 2 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: 4 },
  ratingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#92400E' },
  vibesRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  vibeTag: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  vibeTagText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.medium },
  scoreCard: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius['2xl'], padding: Spacing.xl, overflow: 'hidden', marginBottom: Spacing['2xl'], ...Shadow.lg },
  scoreLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  emotionLabel: { fontSize: FontSize.xs, color: Colors.white, width: 48 },
  emotionBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  emotionFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 3 },
  emotionValue: { fontSize: FontSize.xs, color: Colors.white, width: 32, textAlign: 'right' },
  bigScore: { fontSize: 48, fontWeight: FontWeight.extrabold, color: Colors.white },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: Spacing.lg, marginTop: Spacing.sm },
  reasonCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.gray[50], borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.md },
  reasonIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  reasonTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: 4 },
  reasonDesc: { fontSize: FontSize.sm, color: Colors.gray[500], lineHeight: 20 },
  socialProof: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  socialText: { fontSize: FontSize.sm, color: Colors.primary[700], fontWeight: FontWeight.medium },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.gray[50], borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm },
  infoText: { flex: 1, fontSize: FontSize.base, color: Colors.gray[700] },
  description: { fontSize: FontSize.base, color: Colors.gray[600], lineHeight: 24, marginTop: Spacing.lg },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, backgroundColor: Colors.white, gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius['2xl'], borderWidth: 1.5, borderColor: Colors.primary[300], paddingVertical: Spacing.lg },
  navBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary[600] },
  checkinBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.lg, overflow: 'hidden' },
  checkinBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.white },
});
