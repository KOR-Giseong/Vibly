import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { noticesApi } from '@services/community.service';

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => noticesApi.getNoticeById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary[600]} size="large" />
        </View>
      </LinearGradient>
    );
  }

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

        {notice ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 80 }}
          >
            {notice.isPinned && (
              <View style={styles.pinBadge}>
                <Text style={styles.pinText}>📌 중요 공지</Text>
              </View>
            )}
            <Text style={styles.title}>{notice.title}</Text>
            <Text style={styles.date}>
              {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.body}>{notice.body}</Text>
          </ScrollView>
        ) : (
          <View style={styles.loader}>
            <Text style={styles.errorText}>공지사항을 불러올 수 없습니다.</Text>
          </View>
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
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.base, color: Colors.gray[500] },
  pinBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary[600] + '15',
    borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.sm,
  },
  pinText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary[600] },
  title: {
    fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.gray[900],
    lineHeight: 32, marginBottom: Spacing.sm,
  },
  date: { fontSize: FontSize.sm, color: Colors.gray[400], marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.gray[200], marginBottom: Spacing.lg },
  body: { fontSize: FontSize.base, color: Colors.gray[800], lineHeight: 26 },
});
