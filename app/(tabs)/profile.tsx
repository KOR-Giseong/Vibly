import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings, ChevronRight, MapPin, Bookmark, Star, Crown,
  BarChart2, CreditCard,
} from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';

const MENU_ITEMS = [
  { icon: MapPin,    label: '내 체크인',     route: '/checkin'       },
  { icon: Bookmark,  label: '저장한 장소',   route: '/(tabs)/bookmark' },
  { icon: BarChart2, label: '바이브 리포트', route: '/vibe-report'   },
  { icon: CreditCard,label: '구독 관리',     route: '/subscription'  },
  { icon: Settings,  label: '설정',          route: '/settings'      },
];

const STATS = [
  { label: '체크인', value: '24' },
  { label: '저장',   value: '12' },
  { label: '리뷰',   value: '8'  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Settings size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
            <Text style={styles.avatarEmoji}>{user?.name?.[0] ?? '🙂'}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? '사용자'}</Text>
          <Text style={styles.email}>{user?.email ?? 'user@example.com'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map(({ label, value }, i) => (
              <React.Fragment key={label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Premium Banner */}
        <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.9}>
          <LinearGradient colors={Gradients.primary} style={styles.premiumBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Crown size={24} color={Colors.white} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.premiumTitle}>Vibly Premium</Text>
              <Text style={styles.premiumSub}>무제한 AI 추천 + 상세 바이브 리포트</Text>
            </View>
            <ChevronRight size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map(({ icon: Icon, label, route }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuDivider]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Icon size={18} color={Colors.primary[600]} />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <ChevronRight size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing['2xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['2xl'] },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  profileCard: { backgroundColor: Colors.white, borderRadius: BorderRadius['3xl'], padding: Spacing['3xl'], alignItems: 'center', marginBottom: Spacing['2xl'], ...Shadow.md },
  avatar: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  avatarEmoji: { fontSize: 36, color: Colors.white },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: 4 },
  email: { fontSize: FontSize.sm, color: Colors.gray[500], marginBottom: Spacing['2xl'] },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary[600] },
  statLabel: { fontSize: FontSize.sm, color: Colors.gray[500], marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.gray[200] },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius['2xl'], padding: Spacing.xl,
    marginBottom: Spacing['2xl'], ...Shadow.lg,
  },
  premiumTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  premiumSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  menuCard: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], overflow: 'hidden', marginBottom: Spacing['2xl'], ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.gray[900], fontWeight: FontWeight.medium },
  logoutBtn: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, alignItems: 'center', ...Shadow.sm },
  logoutText: { fontSize: FontSize.md, color: '#EF4444', fontWeight: FontWeight.medium },
});
