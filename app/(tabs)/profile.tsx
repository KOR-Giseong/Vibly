import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings, ChevronRight, MapPin, Bookmark,
  Crown, BarChart2, CreditCard, LogOut, Sparkles,
  Camera, User, Pencil, X, Heart, ShieldCheck,
} from 'lucide-react-native';
import { useCoupleStore } from '@stores/couple.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';
import ScreenTransition from '@components/ScreenTransition';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { icon: MapPin,    label: '내 체크인',     route: '/my-checkins',      color: '#7C3AED' },
  { icon: Bookmark,  label: '저장한 장소',   route: '/(tabs)/bookmark',  color: '#DB2777' },
  { icon: BarChart2, label: '바이브 리포트', route: '/vibe-report',      color: '#0EA5E9' },
  { icon: CreditCard,label: '구독 관리',     route: '/subscription',     color: '#F59E0B' },
  { icon: Settings,  label: '설정',          route: '/settings',         color: '#6B7280' },
] as const;

const VIBE_OPTIONS = [
  { emoji: '☕', label: '아늑한' },
  { emoji: '✨', label: '트렌디한' },
  { emoji: '🌿', label: '조용한' },
  { emoji: '🎉', label: '활기찬' },
  { emoji: '💕', label: '로맨틱한' },
  { emoji: '🎸', label: '힙한' },
  { emoji: '🌊', label: '자연적인' },
  { emoji: '📚', label: '감성적인' },
  { emoji: '🏙️', label: '도시적인' },
  { emoji: '🎨', label: '예술적인' },
];

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

/** 아바타: avatarUrl있으면 이미지, 없으면 기본 아이콘 + 카메라 버튼 */
function AvatarPicker({
  avatarUrl, isPremium, onPress, uploading,
}: {
  avatarUrl?: string;
  isPremium?: boolean;
  onPress: () => void;
  uploading: boolean;
}) {
  return (
    <View style={styles.avatarWrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={uploading}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarCircle} />
        ) : (
          <View style={[styles.avatarCircle, styles.avatarDefault]}>
            <User size={38} color={Colors.gray[400]} strokeWidth={1.5} />
          </View>
        )}
        {/* 카메라 버튼 */}
        <View style={styles.cameraBtn}>
          {uploading
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Camera size={13} color={Colors.white} />
          }
        </View>
      </TouchableOpacity>
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Crown size={10} color={Colors.white} />
        </View>
      )}
    </View>
  );
}

/** 통계 항목 */
function StatItem({ value, label, onPress }: { value: number | string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/** 메뉴 행 */
function MenuItem({
  icon: Icon, label, color, onPress, isLast,
}: {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
  onPress: () => void;
  isLast: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuDivider]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={Colors.gray[300]} />
    </TouchableOpacity>
  );
}

// ─── 애니메이션 훅 ────────────────────────────────────────────────────────────

function useFadeSlide(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

// ─── 프로필 편집 모달 ─────────────────────────────────────────────────────────

function EditProfileModal({
  visible,
  initialName,
  initialNickname,
  initialGender,
  initialVibes,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialName: string;
  initialNickname: string;
  initialGender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  initialVibes: string[];
  onClose: () => void;
  onSave: (data: { name: string; nickname: string; gender: 'MALE' | 'FEMALE' | 'OTHER' | null; preferredVibes: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | null>(initialGender);
  const [vibes, setVibes] = useState<string[]>(initialVibes);
  const [saving, setSaving] = useState(false);

  // modal 열릴 때마다 초기값 동기화
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setNickname(initialNickname);
      setGender(initialGender);
      setVibes(initialVibes);
    }
  }, [visible]);

  const MAX_VIBES = 3;

  const toggleVibe = (label: string) => {
    setVibes((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : prev.length < MAX_VIBES
          ? [...prev, label]
          : prev,
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('이름을 입력해주세요.'); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), nickname: nickname.trim(), gender, preferredVibes: vibes });
      onClose();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.response?.data?.message ?? '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
          <Pressable style={styles.modalSheet}>
            {/* 핸들 */}
            <View style={styles.sheetHandle} />

            {/* 헤더 */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>프로필 편집</Text>
              <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
                <X size={18} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 이름 */}
              <Text style={styles.inputLabel}>이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력하세요"
                placeholderTextColor={Colors.gray[400]}
                maxLength={20}
              />

              {/* 닉네임 */}
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요 (선택)"
                placeholderTextColor={Colors.gray[400]}
                maxLength={30}
                autoCapitalize="none"
              />

              {/* 성별 */}
              <Text style={styles.inputLabel}>성별</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {([['MALE', '남성', '👨'], ['FEMALE', '여성', '👩'], ['OTHER', '기타', '🧑']] as const).map(([val, label, emoji]) => {
                  const selected = gender === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setGender(val)}
                      activeOpacity={0.8}
                      style={[
                        styles.genderChipEdit,
                        selected && styles.genderChipEditSelected,
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      <Text style={[
                        styles.genderChipEditLabel,
                        selected && styles.genderChipEditLabelSelected,
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 선호 바이브 */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <Text style={styles.inputLabel}>선호 바이브</Text>
                <Text style={styles.inputLabelSub}>{vibes.length}/{MAX_VIBES}</Text>
              </View>
              <View style={styles.vibeGrid}>
                {VIBE_OPTIONS.map(({ emoji, label }) => {
                  const selected = vibes.includes(label);
                  const disabled = !selected && vibes.length >= MAX_VIBES;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.vibePillEdit,
                        selected && styles.vibePillSelected,
                        disabled && styles.vibePillDisabled,
                      ]}
                      onPress={() => toggleVibe(label)}
                      activeOpacity={disabled ? 1 : 0.8}
                    >
                      <Text style={[styles.vibeEmoji, disabled && { opacity: 0.35 }]}>{emoji}</Text>
                      <Text style={[
                        styles.vibePillText,
                        selected && styles.vibePillTextSelected,
                        disabled && styles.vibePillTextDisabled,
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 저장 버튼 */}
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={styles.saveBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {saving
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>저장하기</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [adminRulesVisible, setAdminRulesVisible] = useState(false);
  const { coupleInfo } = useCoupleStore();

  // 실제 통계 API
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authService.getUserStats(),
    staleTime: 1000 * 60,
  });

  // 섹션별 스태거 애니메이션
  const headerAnim  = useFadeSlide(0);
  const cardAnim    = useFadeSlide(100);
  const premiumAnim = useFadeSlide(200);
  const menuAnim    = useFadeSlide(300);
  const logoutAnim  = useFadeSlide(400);

  const displayName = user?.nickname ?? user?.name ?? '사용자';

  // ── 아바타 변경 ───────────────────────────────────────────────────────────
  const handleAvatarPress = () => {
    const options = [
      { text: '사진 선택', onPress: handlePickPhoto },
      ...(user?.avatarUrl ? [{ text: '기본 이미지로 변경', onPress: handleResetAvatar }] : []),
      { text: '취소', style: 'cancel' as const },
    ];
    Alert.alert('프로필 사진', '변경할 방법을 선택하세요.', options);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    const base64Uri = `data:${mime};base64,${asset.base64}`;

    setUploading(true);
    try {
      const { avatarUrl } = await authService.updateAvatar(base64Uri);
      const updatedUser = await authService.getMe();
      setUser({ ...updatedUser, avatarUrl });
    } catch {
      Alert.alert('업로드 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetAvatar = async () => {
    setUploading(true);
    try {
      await authService.resetAvatar();
      setUser({ ...(user as any), avatarUrl: null });
    } catch {
      Alert.alert('실패', '기본 이미지로 변경에 실패했어요.');
    } finally {
      setUploading(false);
    }
  };

  // ── 프로필 저장 ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (data: { name: string; nickname: string; gender: 'MALE' | 'FEMALE' | 'OTHER' | null; preferredVibes: string[] }) => {
    const updated = await authService.updateProfile({ ...data, gender: data.gender ?? undefined });
    setUser({ ...(user as any), ...updated });
    qc.invalidateQueries({ queryKey: ['user-stats'] });
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 헤더 ── */}
          <Animated.View style={[styles.header, headerAnim]}>
            <Text style={styles.headerTitle}>프로필</Text>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
              <Settings size={20} color={Colors.gray[700]} />
            </TouchableOpacity>
          </Animated.View>

          {/* ── 프로필 카드 ── */}
          <Animated.View style={[styles.card, cardAnim]}>
            <AvatarPicker
              avatarUrl={user?.avatarUrl}
              isPremium={user?.isPremium}
              onPress={handleAvatarPress}
              uploading={uploading}
            />

            {/* 이름 + 편집 버튼 */}
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              <TouchableOpacity onPress={() => setEditVisible(true)} style={styles.editBtn}>
                <Pencil size={14} color={Colors.primary[600]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.email}>{user?.email ?? ''}</Text>

            {/* 성별 배지 */}
            <View style={styles.genderBadge}>
              <Text style={styles.genderBadgeText}>
                {user?.gender === 'MALE' ? '👨 남성' : user?.gender === 'FEMALE' ? '👩 여성' : user?.gender === 'OTHER' ? '🧑 기타' : '⚪ 성별 미설정'}
              </Text>
            </View>

            {/* 커플 뱃지 */}
            <TouchableOpacity
              style={[styles.coupleBadge, coupleInfo && styles.coupleBadgeActive]}
              onPress={() => router.push('/couple-lounge' as any)}
              activeOpacity={0.8}
            >
              <Heart size={14} color={coupleInfo ? '#E60076' : Colors.gray[400]} fill={coupleInfo ? '#E60076' : 'transparent'} />
              <Text style={[styles.coupleBadgeText, coupleInfo && styles.coupleBadgeTextActive]}>
                {coupleInfo ? `💑 ${coupleInfo.partnerName}와 커플` : '커플 라운지 시작하기'}
              </Text>
              <ChevronRight size={13} color={coupleInfo ? '#E60076' : Colors.gray[400]} />
            </TouchableOpacity>

            {/* 관리자 배지 */}
            {user?.isAdmin && (
              <TouchableOpacity style={styles.adminBadge} onPress={() => setAdminRulesVisible(true)} activeOpacity={0.8}>
                <ShieldCheck size={13} color="#7C3AED" />
                <Text style={styles.adminBadgeText}>관리자</Text>
                <ChevronRight size={12} color="#7C3AED" />
              </TouchableOpacity>
            )}

            {/* 선호 바이브 태그 */}
            {user?.preferredVibes && user.preferredVibes.length > 0 && (
              <View style={styles.vibesRow}>
                {user.preferredVibes.slice(0, 4).map((v) => (
                  <View key={v} style={styles.vibePill}>
                    <Sparkles size={10} color={Colors.primary[600]} />
                    <Text style={styles.vibeText}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 통계 */}
            <View style={styles.statsRow}>
              <StatItem
                value={stats?.checkinCount ?? '—'}
                label="체크인"
                onPress={() => router.push('/my-checkins')}
              />
              <View style={styles.statDivider} />
              <StatItem
                value={stats?.bookmarkCount ?? '—'}
                label="저장"
                onPress={() => router.push('/(tabs)/bookmark')}
              />
              <View style={styles.statDivider} />
              <StatItem
                value={stats?.reviewCount ?? '—'}
                label="리뷰"
                onPress={() => router.push('/my-reviews')}
              />
            </View>
          </Animated.View>

          {/* ── 프리미엄 배너 ── */}
          <Animated.View style={premiumAnim}>
            <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.88}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={styles.premiumBanner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <View style={styles.premiumIconWrap}>
                  <Crown size={22} color={Colors.white} />
                </View>
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>
                    {user?.isPremium ? 'Vibly Premium 이용 중' : 'Vibly Premium'}
                  </Text>
                  <Text style={styles.premiumSub}>
                    {user?.isPremium ? '무제한 AI 추천을 즐기고 계세요 ✨' : '무제한 AI 추천 + 상세 바이브 리포트'}
                  </Text>
                </View>
                <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── 메뉴 카드 ── */}
          <Animated.View style={[styles.menuCard, menuAnim]}>
            {MENU_ITEMS.map(({ icon, label, route, color }, i) => (
              <MenuItem
                key={label}
                icon={icon}
                label={label}
                color={color}
                isLast={i === MENU_ITEMS.length - 1}
                onPress={() => router.push(route as any)}
              />
            ))}
          </Animated.View>

          {/* ── 로그아웃 ── */}
          <Animated.View style={logoutAnim}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color="#EF4444" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* ── 관리자 수칙 모달 ── */}
      <Modal visible={adminRulesVisible} transparent animationType="fade" onRequestClose={() => setAdminRulesVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAdminRulesVisible(false)}>
          <Pressable style={styles.adminRulesSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.adminRulesHeader}>
              <ShieldCheck size={20} color="#7C3AED" />
              <Text style={styles.adminRulesTitle}>관리자 수칙</Text>
            </View>
            {[
              '관리자 계정은 본인 외 타인에게 공유할 수 없습니다.',
              '사용자의 개인정보는 업무 목적 외 열람 및 사용이 금지됩니다.',
              '관리자 권한을 이용한 부당 행위는 즉시 권한이 박탈됩니다.',
              '모든 관리자 활동은 로그로 기록되며 정기적으로 감사됩니다.',
              '서비스 운영 관련 정보를 외부에 무단 공개하지 마십시오.',
              '보안 사고 발생 시 즉시 상급자에게 보고하십시오.',
            ].map((rule, i) => (
              <View key={i} style={styles.adminRuleRow}>
                <View style={styles.adminRuleNum}><Text style={styles.adminRuleNumText}>{i + 1}</Text></View>
                <Text style={styles.adminRuleText}>{rule}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.adminRulesClose} onPress={() => setAdminRulesVisible(false)} activeOpacity={0.85}>
              <Text style={styles.adminRulesCloseText}>확인했습니다</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 프로필 편집 모달 ── */}
      <EditProfileModal
        visible={editVisible}
        initialName={user?.name ?? ''}
        initialNickname={user?.nickname ?? ''}
        initialGender={user?.gender ?? null}
        initialVibes={user?.preferredVibes ?? []}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />
    </ScreenTransition>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['2xl'] },

  // 헤더
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing['2xl'],
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  headerBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },

  // 프로필 카드
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['3xl'],
    paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing['2xl'],
    alignItems: 'center', marginBottom: Spacing.xl, ...Shadow.md,
  },

  // 아바타
  avatarWrap: { marginBottom: Spacing.lg, position: 'relative' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
  avatarDefault: {
    backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary[600],
    borderWidth: 2, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute', bottom: 0, left: 0,
    width: 22, height: 22, borderRadius: BorderRadius.full,
    backgroundColor: '#F59E0B', borderWidth: 2, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },

  // 이름 행
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  editBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  email: { fontSize: FontSize.sm, color: Colors.gray[400], marginBottom: Spacing.sm },

  // 성별 배지 (프로필 카드)
  genderBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray[100], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    marginBottom: Spacing.lg,
  },
  genderBadgeText: { fontSize: FontSize.xs, color: Colors.gray[600], fontWeight: FontWeight.medium },

  // 성별 칩 (편집 모달)
  genderChipEdit: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  genderChipEditSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  genderChipEditLabel: { fontSize: FontSize.sm, color: Colors.gray[500], fontWeight: FontWeight.medium },
  genderChipEditLabelSelected: { color: Colors.primary[700], fontWeight: FontWeight.semibold },

  // 관리자 배지
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F3EEFF', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: '#DDD0F9',
  },
  adminBadgeText: { fontSize: FontSize.xs, color: '#7C3AED', fontWeight: FontWeight.semibold },

  // 관리자 수칙 모달
  adminRulesSheet: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'], margin: Spacing.xl,
    ...Shadow.lg,
  },
  adminRulesHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  adminRulesTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  adminRuleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  adminRuleNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  adminRuleNumText: { fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold },
  adminRuleText: { flex: 1, fontSize: FontSize.sm, color: Colors.gray[700], lineHeight: 20 },
  adminRulesClose: {
    marginTop: Spacing.xl, backgroundColor: '#7C3AED',
    borderRadius: BorderRadius.xl, paddingVertical: 12, alignItems: 'center',
  },
  adminRulesCloseText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },

  // 커플 뱃지
  coupleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gray[100], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  coupleBadgeActive: {
    backgroundColor: '#FDF2F8',
  },
  coupleBadgeText: {
    fontSize: FontSize.xs, color: Colors.gray[500], fontWeight: FontWeight.medium,
  },
  coupleBadgeTextActive: {
    color: '#E60076',
  },

  // 바이브 태그
  vibesRow: {
    flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: Spacing.lg,
  },
  vibePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  vibeText: { fontSize: FontSize.xs, color: Colors.primary[600], fontWeight: FontWeight.medium },

  // 통계
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.gray[100],
    alignSelf: 'stretch', justifyContent: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary[600] },
  statLabel: { fontSize: FontSize.xs, color: Colors.gray[500], marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.gray[100] },

  // 프리미엄 배너
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius['2xl'], padding: Spacing.xl,
    marginBottom: Spacing.xl, gap: Spacing.md,
    shadowColor: '#AD46FF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 12,
  },
  premiumIconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  premiumSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // 메뉴 카드
  menuCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    overflow: 'hidden', marginBottom: Spacing.xl, ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  menuIconWrap: { width: 38, height: 38, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.gray[900], fontWeight: FontWeight.medium },

  // 로그아웃
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.lg, ...Shadow.sm,
  },
  logoutText: { fontSize: FontSize.md, color: '#EF4444', fontWeight: FontWeight.medium },

  // 편집 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalKAV: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    paddingTop: Spacing.md,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.gray[200], alignSelf: 'center', marginBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing['2xl'],
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  sheetClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center',
  },
  inputLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.gray[700], marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  inputLabelSub: {
    fontSize: FontSize.xs, color: Colors.gray[400], fontWeight: FontWeight.medium,
  },
  input: {
    backgroundColor: Colors.gray[50], borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSize.md, color: Colors.gray[900],
    borderWidth: 1, borderColor: Colors.gray[200],
  },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.md },
  vibePillEdit: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 9,
    backgroundColor: Colors.gray[100], borderWidth: 1.5, borderColor: 'transparent',
  },
  vibePillSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  vibeEmoji: { fontSize: 14 },
  vibePillText: { fontSize: FontSize.sm, color: Colors.gray[600], fontWeight: FontWeight.medium },
  vibePillTextSelected: { color: Colors.primary[600] },
  vibePillDisabled: { opacity: 0.35 },
  vibePillTextDisabled: { color: Colors.gray[400] },
  saveBtn: {
    borderRadius: BorderRadius.xl, paddingVertical: 16,
    alignItems: 'center', marginTop: Spacing['2xl'],
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});

