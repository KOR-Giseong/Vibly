import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { noticesApi } from '@services/community.service';
import type { Notice } from '@/types';

function NoticeCard({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        {notice.isPinned && (
          <View style={styles.pinBadge}>
            <Text style={styles.pinText}>📌 중요</Text>
          </View>
        )}
        <Text style={styles.cardTitle} numberOfLines={2}>{notice.title}</Text>
        <Text style={styles.cardDate}>
          {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
      </View>
      <ChevronRight size={18} color={Colors.gray[400]} />
    </TouchableOpacity>
  );
}

export default function NoticeListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['notices', 1, 50],
    queryFn: () => noticesApi.getNotices({ page: 1, limit: 50 }),
    staleTime: 1000 * 60 * 5,
  });

  const sorted = [
    ...(data?.items.filter((n) => n.isPinned) ?? []),
    ...(data?.items.filter((n) => !n.isPinned) ?? []),
  ];

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>공지사항</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary[600]} />
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoticeCard
                notice={item}
                onPress={() => router.push({ pathname: '/community/notice/[id]', params: { id: item.id } })}
              />
            )}
            contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 80 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📢</Text>
                <Text style={styles.emptyText}>아직 공지사항이 없습니다.</Text>
              </View>
            }
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.full, backgroundColor: Colors.white, ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  loader: { marginTop: 60 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm,
  },
  cardLeft: { flex: 1, gap: 4 },
  pinBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[600] + '15', borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2,
  },
  pinText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.primary[600] },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], lineHeight: 22 },
  cardDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.base, color: Colors.gray[500] },
});
