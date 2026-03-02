import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  Heart,
  MapPin,
  Gift,
  Users,
  HeartHandshake,
  MessageCircle,
  Coins,
  Headphones,
  BellOff,
  CheckCheck,
} from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { notificationApi, NOTIF_DISPLAY, NOTIF_ICON, type NotifIconKey } from '@services/notification.service';
import type { AppNotification, NotificationType } from '@/types';

// ─── 아이콘 맵 ────────────────────────────────────────────────────────────────

const ICON_COMP: Record<NotifIconKey, typeof Sparkles> = {
  'sparkles': Sparkles,
  'heart': Heart,
  'map-pin': MapPin,
  'gift': Gift,
  'users': Users,
  'heart-handshake': HeartHandshake,
  'message-circle': MessageCircle,
  'coins': Coins,
  'headphones': Headphones,
};

// ─── 날짜 그룹화 헬퍼 ────────────────────────────────────────────────────────

function getSection(createdAt: string): string {
  const now = new Date();
  const d = new Date(createdAt);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return '오늘';
  if (diffDays < 7) return '이번 주';
  return '이전';
}

function formatTime(createdAt: string): string {
  const now = new Date();
  const d = new Date(createdAt);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  return `${diffDay}일 전`;
}

type SectionData = { title: string; data: AppNotification[] };

function groupNotifications(items: AppNotification[]): SectionData[] {
  const map: Record<string, AppNotification[]> = {};
  const ORDER = ['오늘', '이번 주', '이전'];
  for (const item of items) {
    const section = getSection(item.createdAt);
    if (!map[section]) map[section] = [];
    map[section].push(item);
  }
  return ORDER.filter((k) => map[k]?.length).map((k) => ({ title: k, data: map[k] }));
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await notificationApi.getList(1, 50);
      setSections(groupNotifications(result.items));
      setHasUnread(result.unreadCount > 0);
    } catch {
      // 로드 실패 시 빈 목록 유지
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 탭 포커스마다 새로 고침
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadNotifications();
    }, [loadNotifications]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async (item: AppNotification) => {
    if (item.isRead) return;
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        data: sec.data.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      })),
    );
    setHasUnread((prev) => {
      const stillUnread = sections.some((s) => s.data.some((n) => n.id !== item.id && !n.isRead));
      return stillUnread;
    });
    await notificationApi.markRead(item.id).catch(() => {});
  }, [sections]);

  const handleMarkAllRead = useCallback(async () => {
    setSections((prev) =>
      prev.map((sec) => ({ ...sec, data: sec.data.map((n) => ({ ...n, isRead: true })) })),
    );
    setHasUnread(false);
    await notificationApi.markAllRead().catch(() => {});
  }, []);

  const getIconForType = (type: NotificationType | string) => {
    const key = NOTIF_ICON[type] ?? 'sparkles';
    return ICON_COMP[key] ?? Sparkles;
  };

  const getGradientForType = (type: NotificationType | string): [string, string] => {
    return NOTIF_DISPLAY[type]?.gradient ?? ['#7C3AED', '#DB2777'];
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림</Text>
          {hasUnread ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <CheckCheck size={18} color={Colors.primary[500]} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.center}>
            <BellOff size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>알림이 없어요</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary[500]} />
            }
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => {
              const Icon = getIconForType(item.type);
              const gradient = getGradientForType(item.type);
              return (
                <TouchableOpacity
                  style={[styles.item, !item.isRead && styles.itemUnread]}
                  activeOpacity={0.8}
                  onPress={() => { void handleMarkRead(item); }}
                >
                  <View style={styles.iconWrap}>
                    <LinearGradient
                      colors={gradient}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Icon size={18} color={Colors.white} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  list: { paddingHorizontal: Spacing['2xl'] },
  sectionHeader: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[500],
    marginVertical: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary[500] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textWrap: { flex: 1 },
  itemTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: 2 },
  itemBody: { fontSize: FontSize.sm, color: Colors.gray[500], lineHeight: 20, marginBottom: 4 },
  itemTime: { fontSize: FontSize.xs, color: Colors.gray[400] },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500], marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: Colors.gray[400] },
});
