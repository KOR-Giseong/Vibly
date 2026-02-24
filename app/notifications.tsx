import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Heart, MapPin, Gift } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';

type NotifType = 'recommend' | 'like' | 'nearby' | 'promo' | 'report';

const ICON_MAP: Record<NotifType, { icon: typeof Sparkles; color: string[] }> = {
  recommend: { icon: Sparkles, color: ['#7C3AED', '#DB2777'] },
  like:       { icon: Heart,    color: ['#EF4444', '#F97316'] },
  nearby:     { icon: MapPin,   color: ['#2563EB', '#7C3AED'] },
  promo:      { icon: Gift,     color: ['#F59E0B', '#EF4444'] },
  report:     { icon: Sparkles, color: ['#10B981', '#2563EB'] },
};

const SECTIONS = [
  {
    title: '오늘',
    data: [
      { id: '1', type: 'recommend' as NotifType, title: 'AI 추천 장소가 도착했어요!', body: '성수동에서 지금 기분에 딱 맞는 카페를 찾았어요', time: '방금 전', read: false },
      { id: '2', type: 'like'      as NotifType, title: '리뷰에 좋아요가 달렸어요',    body: '블루보틀 성수 리뷰에 12명이 좋아요를 눌렀어요',  time: '10분 전', read: false },
      { id: '3', type: 'nearby'    as NotifType, title: '근처에 핫한 장소가 있어요!', body: '현재 위치에서 500m 안에 바이브 스코어 90+ 장소', time: '1시간 전', read: true },
    ],
  },
  {
    title: '이전',
    data: [
      { id: '4', type: 'promo'  as NotifType, title: '주말 특별 할인 혜택',      body: '제휴 파트너 장소에서 최대 20% 할인을 받아보세요', time: '어제', read: true },
      { id: '5', type: 'report' as NotifType, title: '1월 바이브 리포트 완성!', body: '지난 달 방문한 장소와 감정 분석 리포트를 확인해보세요', time: '어제', read: true },
    ],
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const { icon: Icon, color } = ICON_MAP[item.type];
          return (
            <TouchableOpacity style={[styles.item, !item.read && styles.itemUnread]} activeOpacity={0.8}>
              <View style={styles.iconWrap}>
                <LinearGradient colors={color} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Icon size={18} color={Colors.white} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  list: { paddingHorizontal: Spacing['2xl'] },
  sectionHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gray[500], marginVertical: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary[500] },
  iconWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  textWrap: { flex: 1 },
  itemTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: 2 },
  itemBody: { fontSize: FontSize.sm, color: Colors.gray[500], lineHeight: 20, marginBottom: 4 },
  itemTime: { fontSize: FontSize.xs, color: Colors.gray[400] },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500], marginTop: 4 },
});
