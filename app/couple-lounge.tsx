import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  Animated,
  Easing,
  Pressable,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart, Plus, Camera, Sparkles, ChevronLeft, ChevronRight,
  UserPlus, Bookmark, User, Coins, Flag,
  MessageCircle, Send, Gift, X, Check, CalendarDays,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors, FontSize, FontWeight, Spacing,
  BorderRadius, Shadow, Gradients,
} from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { useCoupleStore } from '@stores/couple.store';
import { useCreditStore } from '@stores/credit.store';
import { authService } from '@services/auth.service';
import { coupleService } from '@services/couple.service';
import { PartnerCard } from '@components/features/couple/PartnerCard';
import { DatePlanCard } from '@components/features/couple/DatePlanCard';
import { MemoryGrid } from '@components/features/couple/MemoryGrid';
import { ReceivedInvitationCard, SentInvitationCard } from '@components/features/couple/InvitationCard';
import { CoupleInviteModal } from '@components/features/couple/CoupleInviteModal';
import type {
  CoupleInvitation, DatePlan, CoupleMemory,
  PartnerProfile, DatePlanStatus, CoupleMessage, CoupleCreditHistory,
} from '@types';

type CoupleTab = 'home' | 'scrap' | 'date' | 'memory' | 'chat';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── 성별별 랜딩 카피 ──────────────────────────────────────────────────────────
function getLandingCopy(gender?: string) {
  if (gender === 'MALE') {
    return {
      emoji: '🗺️',
      title: '데이트 코스 기획이\n막막하신가요?',
      desc: 'AI가 완벽한 데이트 코스를 설계해드립니다',
    };
  }
  if (gender === 'FEMALE') {
    return {
      emoji: '😏',
      title: '남자친구가 데이트 장소를\n못 정하나요?',
      desc: '커플 라운지에서 함께 계획해봐요',
    };
  }
  return {
    emoji: '💕',
    title: '연인과 함께하는\n특별한 데이트 공간',
    desc: '커플 등록하고 특별한 기능을 즐겨보세요',
  };
}

// ── 떠오르는 하트 애니메이션 (랜딩 페이지용) ─────────────────────────────────
const HEART_CONFIGS = [
  { x: -28, delay: 0,    size: 14, duration: 2200 },
  { x:   8, delay: 700,  size: 10, duration: 2600 },
  { x:  30, delay: 1300, size: 16, duration: 2000 },
  { x: -10, delay: 1900, size: 9,  duration: 2800 },
  { x:  18, delay: 1000, size: 12, duration: 2400 },
];

function FloatingHearts() {
  const anims = useRef(
    HEART_CONFIGS.map(() => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    anims.forEach(({ y, opacity }, i) => {
      const { delay, duration } = HEART_CONFIGS[i];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(y, {
              toValue: -110,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.75, duration: 300, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0,    duration: duration - 300, useNativeDriver: true }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(y,       { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
    });
    return () => anims.forEach(({ y, opacity }) => { y.stopAnimation(); opacity.stopAnimation(); });
  }, []);

  return (
    <View style={styles.heartsContainer} pointerEvents="none">
      {anims.map(({ y, opacity }, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            transform: [{ translateX: HEART_CONFIGS[i].x }, { translateY: y }],
            opacity,
          }}
        >
          <Heart size={HEART_CONFIGS[i].size} color="#E60076" fill="#E60076" />
        </Animated.View>
      ))}
    </View>
  );
}

// ── 커플 배경 하트 애니메이션 (화면 전체, 커플 상태 전용) ────────────────────
const BG_HEART_CONFIGS = [
  { x: SCREEN_WIDTH * 0.08,  delay: 0,    size: 10, duration: 5000 },
  { x: SCREEN_WIDTH * 0.22,  delay: 1200, size: 7,  duration: 6000 },
  { x: SCREEN_WIDTH * 0.38,  delay: 2400, size: 12, duration: 4500 },
  { x: SCREEN_WIDTH * 0.52,  delay: 600,  size: 8,  duration: 5500 },
  { x: SCREEN_WIDTH * 0.65,  delay: 3000, size: 11, duration: 4800 },
  { x: SCREEN_WIDTH * 0.78,  delay: 1800, size: 9,  duration: 5200 },
  { x: SCREEN_WIDTH * 0.14,  delay: 3600, size: 6,  duration: 6500 },
  { x: SCREEN_WIDTH * 0.88,  delay: 900,  size: 13, duration: 4200 },
];

function BackgroundHearts() {
  const anims = useRef(
    BG_HEART_CONFIGS.map(() => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    anims.forEach(({ y, opacity }, i) => {
      const { delay, duration } = BG_HEART_CONFIGS[i];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(y, {
              toValue: -(SCREEN_HEIGHT * 0.75),
              duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.45, duration: 500, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: duration - 500, useNativeDriver: true }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(y,       { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
    });
    return () => anims.forEach(({ y, opacity }) => { y.stopAnimation(); opacity.stopAnimation(); });
  }, []);

  return (
    <View style={styles.bgHeartsContainer} pointerEvents="none">
      {anims.map(({ y, opacity }, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            bottom: 60,
            left: BG_HEART_CONFIGS[i].x,
            transform: [{ translateY: y }],
            opacity,
          }}
        >
          <Heart size={BG_HEART_CONFIGS[i].size} color="#E60076" fill="#E60076" />
        </Animated.View>
      ))}
    </View>
  );
}

// ── 신고 모달 ──────────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: 'HARASSMENT', label: '성희롱 / 괴롭힘' },
  { value: 'SPAM',       label: '스팸 / 광고' },
  { value: 'ABUSE',      label: '욕설 / 혐오' },
  { value: 'OTHER',      label: '기타' },
];

function ReportModal({
  visible,
  targetId,
  targetName,
  onClose,
}: {
  visible: boolean;
  targetId: string;
  targetName: string;
  onClose: () => void;
}) {
  const [reason, setReason]       = useState('HARASSMENT');
  const [detail, setDetail]       = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [sending, setSending]     = useState(false);

  const handleClose = () => {
    setDetail('');
    setReason('HARASSMENT');
    setImageUris([]);
    onClose();
  };

  const pickImage = async () => {
    if (imageUris.length >= 3) {
      Alert.alert('사진', '최대 3장까지 첨부할 수 있어요.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('사진 접근 권한 필요', '설정에서 사진 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setImageUris((prev) => [...prev, `data:${mimeType};base64,${asset.base64}`]);
    }
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      await coupleService.reportUser({
        reportedId: targetId,
        reason,
        detail: detail.trim() || undefined,
        imageUrls: imageUris.length > 0 ? imageUris : undefined,
      });
      Alert.alert('신고 완료', '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.');
      handleClose();
    } catch {
      Alert.alert('오류', '신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.reportOverlay} onPress={handleClose}>
          <Pressable style={styles.reportSheet} onPress={() => {}}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>{targetName} 신고</Text>
            <Text style={styles.reportSubtitle}>신고 사유를 선택해주세요</Text>

            <View style={styles.reportReasons}>
              {REPORT_REASONS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.reportReasonBtn, reason === value && styles.reportReasonBtnActive]}
                  onPress={() => setReason(value)}
                >
                  <Text style={[styles.reportReasonText, reason === value && styles.reportReasonTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reportDetailInput}
              placeholder="구체적인 내용을 작성해주세요 (선택)"
              placeholderTextColor={Colors.gray[300]}
              value={detail}
              onChangeText={setDetail}
              multiline
              maxLength={500}
            />

            {/* 사진 첨부 */}
            <Text style={styles.reportImgLabel}>사진 첨부 (선택, 최대 3장)</Text>
            <View style={styles.reportImgRow}>
              {imageUris.map((uri, i) => (
                <View key={i} style={styles.reportImgThumbWrap}>
                  <Image source={{ uri }} style={styles.reportImgThumb} />
                  <TouchableOpacity
                    style={styles.reportImgRemove}
                    onPress={() => setImageUris((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X size={12} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
              {imageUris.length < 3 && (
                <TouchableOpacity style={styles.reportImgAdd} onPress={pickImage}>
                  <Plus size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.reportLegalNote}>
              <Text style={styles.reportLegalText}>
                신고된 내용은 검토 후 제재 처리되며, 심각한 위반 행위는 법적 조치로 이어질 수 있습니다.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.reportSubmitBtn, sending && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.reportSubmitText}>신고 접수</Text>
              }
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 공통 헤더 ─────────────────────────────────────────────────────────────────
function ScreenHeader({
  onBack,
  rightAction,
}: {
  onBack: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerBackWrap}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerTitleRow}>
        <Heart size={17} color="#E60076" fill="#E60076" />
        <Text style={styles.headerTitle}>커플 라운지</Text>
      </View>
      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
}

// ── 미등록 랜딩 ───────────────────────────────────────────────────────────────
function LandingView({
  gender,
  onInvite,
  received,
  sent,
  onAccept,
  onReject,
  onCancel,
  onReport,
  invLoading,
}: {
  gender?: string;
  onInvite: () => void;
  received: CoupleInvitation[];
  sent: CoupleInvitation[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  onReport: (senderId: string, senderName: string) => void;
  invLoading: string | null;
}) {
  const copy = getLandingCopy(gender);
  const hasPending = received.length > 0 || sent.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.landingScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* 히어로 섹션 */}
      <View style={styles.heroSection}>
        <View style={styles.heroEmojiWrap}>
          <Text style={styles.heroEmoji}>{copy.emoji}</Text>
          <FloatingHearts />
        </View>
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.heroDesc}>{copy.desc}</Text>

        <TouchableOpacity style={styles.inviteBtn} onPress={onInvite} activeOpacity={0.85}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={styles.inviteBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <UserPlus size={18} color={Colors.white} />
            <Text style={styles.inviteBtnText}>파트너 초대하기</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 기능 미리보기 */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionLabel}>커플 전용 기능</Text>
        <View style={styles.featureGrid}>
          {[
            { icon: '📍', label: '스크랩 공유', desc: '서로의 관심 장소 공유' },
            { icon: '📅', label: 'AI 데이트 플랜', desc: '스크랩 장소 기반 코스 추천' },
            { icon: '📸', label: '추억 앨범', desc: '데이트 사진을 함께 기록' },
            { icon: '💎', label: '크레딧 선물', desc: '파트너에게 크레딧 전송' },
            { icon: '💬', label: '1:1 채팅', desc: '파트너와 실시간 대화' },
            { icon: '💕', label: '기념일 D-DAY', desc: '커플 기념일 카운트다운' },
          ].map(({ icon, label, desc }) => (
            <View key={label} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* 구독 전용 AI 비서 카드 */}
        <LinearGradient
          colors={['#F3E8FF', '#FFF0F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.featurePremiumCard}
        >
          <View style={styles.featurePremiumLeft}>
            <View style={styles.featurePremiumBadge}>
              <Text style={styles.featurePremiumBadgeText}>👑 구독 전용</Text>
            </View>
            <Text style={styles.featurePremiumLabel}>AI 대화형 데이트 비서</Text>
            <Text style={styles.featurePremiumDesc}>우리 커플의 취향을 분석해{`\n`}완벽한 데이트를 설계해드려요</Text>
          </View>
          <Text style={styles.featurePremiumEmoji}>🤖</Text>
        </LinearGradient>
      </View>

      {/* 초대 섹션 */}
      {hasPending && (
        <View style={styles.invitationsSection}>
          {received.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>받은 초대</Text>
              <View style={{ gap: 10 }}>
                {received.map((inv) => (
                  <ReceivedInvitationCard
                    key={inv.id}
                    invitation={inv}
                    onAccept={onAccept}
                    onReject={onReject}
                    onReport={onReport}
                    loading={invLoading === inv.id}
                  />
                ))}
              </View>
            </>
          )}
          {sent.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>보낸 초대</Text>
              <View style={{ gap: 10 }}>
                {sent.map((inv) => (
                  <SentInvitationCard
                    key={inv.id}
                    invitation={inv}
                    onCancel={onCancel}
                    loading={invLoading === inv.id}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────────────────────────
const GIFT_AMOUNTS = [10, 30, 50, 100];

function CreditHistoryItem({ item }: { item: CoupleCreditHistory }) {
  const dateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return (
    <View style={styles.creditHistoryItem}>
      <View style={[
        styles.creditHistoryDot,
        { backgroundColor: item.isMine ? '#E60076' : '#9810FA' },
      ]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.creditHistoryText}>
          {item.isMine
            ? `파트너에게 💝 ${item.amount} 크레딧 선물`
            : `${item.senderName}님에게 💝 ${item.amount} 크레딧 받음`}
        </Text>
        <Text style={styles.creditHistoryDate}>{dateStr}</Text>
      </View>
      <Text style={[
        styles.creditHistoryAmount,
        { color: item.isMine ? '#E60076' : '#9810FA' },
      ]}>
        {item.isMine ? `-${item.amount}` : `+${item.amount}`}
      </Text>
    </View>
  );
}

// ── 달력 날짜 선택 컴포넌트 ───────────────────────────────────────────────────
const CAL_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function AnniversaryCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const canGoNext = !(viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d: number) =>
    selected?.getFullYear() === viewYear &&
    selected?.getMonth() === viewMonth &&
    selected?.getDate() === d;
  const isToday = (d: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
  const isDisabled = (d: number) => new Date(viewYear, viewMonth, d) > today;

  return (
    <View>
      {/* 월 헤더 */}
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
          <ChevronLeft size={20} color={Colors.gray[600]} />
        </TouchableOpacity>
        <Text style={styles.calHeaderText}>{viewYear}년 {viewMonth + 1}월</Text>
        <TouchableOpacity onPress={canGoNext ? nextMonth : undefined} style={styles.calNavBtn}>
          <ChevronRight size={20} color={canGoNext ? Colors.gray[600] : Colors.gray[200]} />
        </TouchableOpacity>
      </View>
      {/* 요일 행 */}
      <View style={styles.calDayRow}>
        {CAL_DAYS.map((d, i) => (
          <Text key={d} style={[styles.calDayText, i === 0 && { color: '#E60076' }]}>{d}</Text>
        ))}
      </View>
      {/* 날짜 그리드 */}
      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={styles.calCell} />;
          const sel = isSel(day);
          const dis = isDisabled(day);
          const tod = isToday(day);
          const isSun = idx % 7 === 0;
          return (
            <TouchableOpacity
              key={`d-${idx}`}
              style={[styles.calCell, sel && styles.calCellSel, tod && !sel && styles.calCellToday]}
              onPress={() => !dis && onSelect(new Date(viewYear, viewMonth, day))}
              disabled={dis}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.calCellText,
                isSun && { color: '#E60076' },
                dis && styles.calCellDisabled,
                sel && styles.calCellSelText,
                tod && !sel && styles.calCellTodayText,
              ]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function HomeTab({
  coupleInfo,
  partnerProfile,
  nextPlan,
}: {
  coupleInfo: NonNullable<ReturnType<typeof useCoupleStore.getState>['coupleInfo']>;
  partnerProfile?: PartnerProfile;
  nextPlan?: DatePlan;
}) {
  const router = useRouter();
  const { spendCredits } = useCreditStore();
  const { setCoupleInfo } = useCoupleStore();
  const [giftModal, setGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState(30);
  const [gifting, setGifting] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CoupleCreditHistory[]>([]);

  // ── 기념일
  const [showAnnivModal, setShowAnnivModal] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(
    coupleInfo.anniversaryDate ? new Date(coupleInfo.anniversaryDate) : null,
  );
  const [savingAnniv, setSavingAnniv] = useState(false);

  // D+N 계산
  const anniversaryDiff = (() => {
    if (!coupleInfo.anniversaryDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const anniv = new Date(coupleInfo.anniversaryDate); anniv.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - anniv.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const handleSaveAnniversary = async () => {
    if (!pickedDate) return;
    setSavingAnniv(true);
    try {
      const isoStr = pickedDate.toISOString();
      await coupleService.setAnniversaryDate(isoStr);
      setCoupleInfo({ ...coupleInfo, anniversaryDate: isoStr });
      setShowAnnivModal(false);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '기념일 저장에 실패했어요.');
    } finally {
      setSavingAnniv(false);
    }
  };

  useEffect(() => {
    coupleService.getCreditHistory().then(setCreditHistory).catch(() => {});
  }, []);

  const handleGift = async () => {
    setGifting(true);
    try {
      await coupleService.transferCredits(giftAmount);
      spendCredits(giftAmount);
      // 내역 즉시 반영
      const newItem: CoupleCreditHistory = {
        id: Date.now().toString(),
        senderId: coupleInfo.partnerId, // 임시
        senderName: '나',
        senderAvatarUrl: null,
        amount: giftAmount,
        createdAt: new Date().toISOString(),
        isMine: true,
      };
      setCreditHistory((prev) => [newItem, ...prev]);
      Alert.alert('선물 완료 💝', `${giftAmount} 크레딧을 파트너에게 선물했습니다.`);
      setGiftModal(false);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '크레딧 선물에 실패했습니다.');
    } finally {
      setGifting(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <PartnerCard coupleInfo={coupleInfo} partnerProfile={partnerProfile} />

      {/* ── 기념일 D+N 카드 */}
      {coupleInfo.anniversaryDate && anniversaryDiff !== null ? (
        <LinearGradient
          colors={['#9810FA', '#E60076']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.anniversaryCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.anniversaryDayLabel}>함께한 지</Text>
            <View style={styles.anniversaryDayRow}>
              <Text style={styles.anniversaryDayNum}>
                {anniversaryDiff === 0 ? 'D-Day' : `D+${anniversaryDiff.toLocaleString()}`}
              </Text>
            </View>
            <Text style={styles.anniversaryDateStr}>
              {new Date(coupleInfo.anniversaryDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}부터
            </Text>
          </View>
          <TouchableOpacity onPress={() => { setPickedDate(new Date(coupleInfo.anniversaryDate!)); setShowAnnivModal(true); }} style={styles.anniversaryEditBtn}>
            <CalendarDays size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.anniversaryEditText}>변경</Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <TouchableOpacity
          style={styles.anniversaryEmpty}
          onPress={() => { setPickedDate(null); setShowAnnivModal(true); }}
          activeOpacity={0.8}
        >
          <CalendarDays size={20} color="#9810FA" />
          <View style={{ flex: 1 }}>
            <Text style={styles.anniversaryEmptyTitle}>기념일을 설정해보세요 💕</Text>
            <Text style={styles.anniversaryEmptyDesc}>처음 만난 날을 등록하면 D+N을 계산해드려요</Text>
          </View>
          <ChevronRight size={16} color={Colors.gray[300]} />
        </TouchableOpacity>
      )}

      {/* 기념일 달력 모달 */}
      <Modal visible={showAnnivModal} transparent animationType="slide" onRequestClose={() => setShowAnnivModal(false)}>
        <Pressable style={styles.reportOverlay} onPress={() => setShowAnnivModal(false)}>
          <Pressable style={styles.reportSheet} onPress={() => {}}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>💕 기념일 설정</Text>
            <Text style={styles.reportSubtitle}>처음 만난 날 또는 사귀기 시작한 날을 선택하세요</Text>
            <AnniversaryCalendar selected={pickedDate} onSelect={setPickedDate} />
            <TouchableOpacity
              style={[styles.giftSubmitBtn, (!pickedDate || savingAnniv) && { opacity: 0.5 }, { marginTop: 16 }]}
              onPress={handleSaveAnniversary}
              disabled={!pickedDate || savingAnniv}
            >
              {savingAnniv
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.reportSubmitText}>
                    {pickedDate
                      ? `${pickedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 저장하기`
                      : '날짜를 선택해주세요'}
                  </Text>
              }
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 크레딧 선물 버튼 */}
      <TouchableOpacity style={styles.giftBtn} onPress={() => setGiftModal(true)} activeOpacity={0.85}>
        <Gift size={16} color="#E60076" />
        <Text style={styles.giftBtnText}>파트너에게 크레딧 선물하기 💝</Text>
      </TouchableOpacity>

      {/* 크레딧 선물 내역 */}
      {creditHistory.length > 0 && (
        <View style={styles.creditHistoryBox}>
          <Text style={styles.creditHistoryTitle}>💳 크레딧 선물 내역</Text>
          {creditHistory.slice(0, 10).map((item) => (
            <CreditHistoryItem key={item.id} item={item} />
          ))}
        </View>
      )}

      {nextPlan && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>다음 데이트</Text>
          <DatePlanCard
            plan={nextPlan}
            onPress={() => router.push({ pathname: '/couple/date-plan-form' as any, params: { id: nextPlan.id, title: nextPlan.title, dateAt: nextPlan.dateAt, memo: nextPlan.memo ?? '' } })}
          />
        </View>
      )}

      {/* 크레딧 선물 모달 */}
      <Modal visible={giftModal} transparent animationType="slide" onRequestClose={() => setGiftModal(false)}>
        <Pressable style={styles.reportOverlay} onPress={() => setGiftModal(false)}>
          <Pressable style={styles.reportSheet} onPress={() => {}}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>💝 크레딧 선물</Text>
            <Text style={styles.reportSubtitle}>파트너에게 선물할 크레딧을 선택하세요</Text>
            <View style={styles.giftAmountRow}>
              {GIFT_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.giftAmountBtn, giftAmount === amount && styles.giftAmountBtnActive]}
                  onPress={() => setGiftAmount(amount)}
                >
                  <Coins size={14} color={giftAmount === amount ? '#E60076' : Colors.gray[400]} />
                  <Text style={[styles.giftAmountText, giftAmount === amount && styles.giftAmountTextActive]}>
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.giftSubmitBtn, gifting && { opacity: 0.5 }]}
              onPress={handleGift}
              disabled={gifting}
            >
              {gifting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.reportSubmitText}>{giftAmount} 크레딧 선물하기 💝</Text>
              }
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── 스크랩 탭 ─────────────────────────────────────────────────────────────────
function ScrapTab() {
  const [tab, setTab] = useState<'mine' | 'partner'>('partner');
  const [partnerBookmarks, setPartnerBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPartner = useCallback(async () => {
    if (tab !== 'partner') return;
    setLoading(true);
    try {
      const res = await coupleService.getPartnerBookmarks();
      setPartnerBookmarks(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadPartner(); }, [loadPartner]);

  return (
    <View style={{ flex: 1 }}>
      {/* 토글 */}
      <View style={styles.segmentWrap}>
        {(['partner', 'mine'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segmentBtn, tab === t && styles.segmentBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === 'mine' ? '내 스크랩' : '파트너 스크랩'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'mine' ? (
        <View style={styles.emptyWrap}>
          <Bookmark size={44} color={Colors.gray[200]} />
          <Text style={styles.emptyTitle}>내 스크랩은</Text>
          <Text style={styles.emptyDesc}>저장 탭에서 확인하세요</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#E60076" style={{ marginTop: 48 }} />
      ) : partnerBookmarks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Bookmark size={44} color={Colors.gray[200]} />
          <Text style={styles.emptyTitle}>파트너의 스크랩이 없습니다</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {partnerBookmarks.map((place) => (
            <View key={place.id} style={styles.placeCard}>
              {place.imageUrl && (
                <Image source={{ uri: place.imageUrl }} style={styles.placeCardImg} />
              )}
              <View style={styles.placeCardInfo}>
                <Text style={styles.placeCardName}>{place.name}</Text>
                <Text style={styles.placeCardAddr} numberOfLines={1}>{place.address}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── 데이트 탭 ─────────────────────────────────────────────────────────────────
const DATE_HOW_TO_STEPS = [
  {
    emoji: '🔖',
    title: '장소 스크랩',
    desc: '홈 탭 지도나 검색에서 마음에 드는 장소를 북마크해두세요. AI 분석에도 활용돼요.',
    color: '#9810FA',
    bg: '#F5F0FF',
  },
  {
    emoji: '➕',
    title: '플랜 추가',
    desc: '"플랜 추가" 버튼으로 날짜·제목을 정해 데이트 계획을 만들어보세요.',
    color: '#E60076',
    bg: '#FFF0F8',
  },
  {
    emoji: '🤖',
    title: 'AI 코스 추천',
    desc: '북마크된 장소를 분석해 최적 데이트 코스를 추천해드려요. (15 크레딧)',
    color: '#7C3AED',
    bg: '#F3E8FF',
  },
  {
    emoji: '✅',
    title: '완료 후 추억 저장',
    desc: '데이트 후 ✓ 버튼으로 완료 처리하면 사진을 추억 탭에 바로 저장할 수 있어요.',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
];

function DateHowToModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.howToOverlay} onPress={onClose}>
        <Pressable style={styles.howToSheet}>
          <View style={styles.reportHandle} />
          <View style={styles.howToHeader}>
            <Text style={styles.howToTitle}>📅 데이트 탭 사용법</Text>
            <TouchableOpacity onPress={onClose} style={styles.howToCloseX}>
              <X size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
            {DATE_HOW_TO_STEPS.map((step, i) => (
              <View key={i} style={styles.howToItem}>
                <View style={[styles.howToEmojiWrap, { backgroundColor: step.bg }]}>
                  <Text style={{ fontSize: 22 }}>{step.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.howToItemHeader}>
                    <View style={[styles.howToStep, { backgroundColor: step.bg }]}>
                      <Text style={[styles.howToStepText, { color: step.color }]}>STEP {i + 1}</Text>
                    </View>
                    <Text style={styles.howToItemTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.howToItemDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── AI 데이트 코스 상세 모달 ────────────────────────────────────────────────────
function AiCourseDetailModal({ group, visible, onClose, onStatusChange }: {
  group: AiCourseGroup | null;
  visible: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: DatePlanStatus) => void;
}) {
  if (!group) return null;

  const parseMemo = (memo: string | null) => {
    if (!memo) return { time: null, place: null, tip: null };
    const m = memo.match(/\[AI코스\]\s*([^\s·]+)\s*·\s*(.+?)\s*—\s*(.+)/);
    if (m) return { time: m[1], place: m[2].trim(), tip: m[3].trim() };
    return { time: null, place: memo.replace('[AI코스]', '').trim(), tip: null };
  };

  const first = group.plans[0];
  const dateStr = new Date(first.dateAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
  const now = new Date();
  const target = new Date(first.dateAt);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tarDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round((tarDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));
  const dDay = diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  const dDayColor = diff === 0 ? '#E60076' : diff > 0 ? '#9810FA' : '#DC2626';
  const allDone = group.plans.every((p) => p.status !== 'PLANNED');

  const sheetHeight = Dimensions.get('window').height * 0.78;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.howToOverlay} onPress={onClose}>
        <Pressable style={[styles.howToSheet, { height: sheetHeight, paddingBottom: 0 }]}>
          <View style={styles.reportHandle} />
          {/* 헤더 */}
          <View style={styles.aiDetailHeader}>
            <LinearGradient colors={['#9810FA', '#E60076']} style={styles.aiDetailIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Sparkles size={14} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.aiDetailTitle}>AI 데이트 코스</Text>
                <View style={[styles.aiCourseDDay, { backgroundColor: dDayColor + '20' }]}>
                  <Text style={[styles.aiCourseDDayTxt, { color: dDayColor }]}>{dDay}</Text>
                </View>
                {allDone && (
                  <View style={styles.aiCourseDoneBadge}>
                    <Text style={styles.aiCourseDoneTxt}>완료</Text>
                  </View>
                )}
              </View>
              <Text style={styles.aiDetailDateTxt}>{dateStr} · {group.plans.length}개 장소</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.howToCloseX}>
              <X size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: Colors.gray[100], marginHorizontal: 20 }} />
          {/* 타임라인 */}
          <ScrollView style={styles.aiDetailScroll} contentContainerStyle={[styles.aiDetailContent, { paddingBottom: 48 }]} showsVerticalScrollIndicator={false}>
            {group.plans.map((plan, idx) => {
              const { time, place, tip } = parseMemo(plan.memo);
              const isLast = idx === group.plans.length - 1;
              const done = plan.status !== 'PLANNED';
              return (
                <View key={plan.id} style={styles.aiDetailRow}>
                  <View style={styles.aiDetailLeft}>
                    <Text style={[styles.aiDetailTime, done && { color: Colors.gray[400] }]}>{time ?? '—'}</Text>
                    <View style={[styles.aiDetailDot, done && { backgroundColor: Colors.gray[300] }]} />
                    {!isLast && <View style={[styles.aiDetailLine, done && { backgroundColor: Colors.gray[200] }]} />}
                  </View>
                  <View style={[styles.aiDetailRight, isLast && { paddingBottom: 4 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aiDetailPlace, done && { color: Colors.gray[400], textDecorationLine: 'line-through' }]}>
                        {place ?? plan.title}
                      </Text>
                      {tip && (
                        <Text style={[styles.aiDetailTip, done && { color: Colors.gray[300] }]}>
                          {tip}
                        </Text>
                      )}
                    </View>
                    {plan.status === 'PLANNED' ? (
                      <TouchableOpacity
                        onPress={() => onStatusChange(plan.id, 'COMPLETED')}
                        style={styles.aiCourseCheckBtn}
                        activeOpacity={0.7}
                      >
                        <Check size={13} color="#9810FA" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.aiCourseDoneChip}>
                        <Check size={11} color="#10B981" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── AI 데이트 코스 그룹 카드 ──────────────────────────────────────────────────
interface AiCourseGroup {
  dateKey: string; // yyyy-MM-dd
  plans: DatePlan[];
}

function AiCoursePlanGroup({ group, onStatusChange, onOpenDetail }: {
  group: AiCourseGroup;
  onStatusChange: (id: string, status: DatePlanStatus) => void;
  onOpenDetail: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const dateStr = new Date(group.plans[0].dateAt).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  // D-Day 계산
  const now = new Date();
  const target = new Date(group.plans[0].dateAt);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tarDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round((tarDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));
  const dDay = diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  const dDayColor = diff === 0 ? '#E60076' : diff > 0 ? '#9810FA' : '#DC2626';

  // 모두 완료 여부
  const allDone = group.plans.every((p) => p.status !== 'PLANNED');

  /* 메모에서 시간 파싱: "[AI코스] 12:00 · 카페 — ..." → "12:00" */
  const parseTime = (memo: string | null) => {
    if (!memo) return null;
    const m = memo.match(/\[AI코스\]\s*([^\s·]+)/);
    return m ? m[1] : null;
  };

  return (
    <View style={[
      styles.aiCourseCard,
      { borderLeftColor: diff < 0 ? '#DC2626' : diff === 0 ? '#E60076' : '#9810FA' },
    ]}>
      {/* 헤더 */}
      <View style={styles.aiCourseHeader}>
        <TouchableOpacity
          style={styles.aiCourseHeaderLeft}
          onPress={onOpenDetail}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#9810FA','#E60076']} style={styles.aiCourseIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Sparkles size={12} color="#fff" />
          </LinearGradient>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.aiCourseTitle}>AI 데이트 코스</Text>
              <View style={[styles.aiCourseDDay, { backgroundColor: dDayColor + '20' }]}>
                <Text style={[styles.aiCourseDDayTxt, { color: dDayColor }]}>{dDay}</Text>
              </View>
              {allDone && (
                <View style={styles.aiCourseDoneBadge}>
                  <Text style={styles.aiCourseDoneTxt}>완료</Text>
                </View>
              )}
            </View>
            <Text style={styles.aiCourseDateTxt}>{dateStr} · {group.plans.length}개 장소</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={{ padding: 4 }}>
          <Text style={{ color: Colors.gray[400], fontSize: 18 }}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* 타임라인 아이템 */}
      {expanded && (
        <View style={styles.aiCourseBody}>
          {group.plans.map((plan, idx) => {
            const time = parseTime(plan.memo);
            const isLast = idx === group.plans.length - 1;
            const done = plan.status !== 'PLANNED';
            return (
              <View key={plan.id} style={styles.aiCourseRow}>
                <View style={styles.aiCourseLeft}>
                  <Text style={[styles.aiCourseTime, done && { color: Colors.gray[400] }]}>
                    {time ?? '—'}
                  </Text>
                  <View style={[styles.aiCourseDot, done && { backgroundColor: Colors.gray[300] }]} />
                  {!isLast && <View style={[styles.aiCourseLine, done && { backgroundColor: Colors.gray[200] }]} />}
                </View>
                <View style={styles.aiCourseItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text
                      style={[styles.aiCourseItemTitle, done && { color: Colors.gray[400], textDecorationLine: 'line-through' }]}
                      numberOfLines={1}
                    >
                      {plan.title}
                    </Text>
                  </View>
                  {plan.status === 'PLANNED' && (
                    <TouchableOpacity
                      onPress={() => onStatusChange(plan.id, 'COMPLETED')}
                      style={styles.aiCourseCheckBtn}
                      activeOpacity={0.7}
                    >
                      <Check size={13} color="#9810FA" />
                    </TouchableOpacity>
                  )}
                  {done && (
                    <View style={styles.aiCourseDoneChip}>
                      <Check size={11} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DateTab() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { isPremium } = useCreditStore();
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [howToVisible, setHowToVisible] = useState(false);
  const [aiNoteVisible, setAiNoteVisible] = useState(false);
  const [aiNote, setAiNote] = useState('');

  // 완료 후 추억 업로드 상태
  const [memoryUploading, setMemoryUploading] = useState(false);

  // AI 코스 상세 모달
  const [detailGroup, setDetailGroup] = useState<AiCourseGroup | null>(null);

  // 포커스 변화(form에서 돌아올 때 포함)마다 플랜 새로고침
  useEffect(() => {
    if (!isFocused) return;
    coupleService.getDatePlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isFocused]);

  // AI코스 플랜 분리: [AI코스] 메모 prefix
  const isAiCoursePlan = (p: DatePlan) => !!p.memo?.startsWith('[AI코스]');

  // 예정: dateAt ASC / 완료+취소: updatedAt DESC (AI코스 제외)
  const planned = [...plans]
    .filter((p) => p.status === 'PLANNED' && !isAiCoursePlan(p))
    .sort((a, b) => new Date(a.dateAt).getTime() - new Date(b.dateAt).getTime());
  const done = [...plans]
    .filter((p) => p.status !== 'PLANNED' && !isAiCoursePlan(p))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // AI코스 플랜들을 날짜별로 그룹핑 (PLANNED 먼저, 완료/취소 별도)
  const aiCoursePlanned: AiCourseGroup[] = (() => {
    const map: Record<string, DatePlan[]> = {};
    plans
      .filter((p) => p.status === 'PLANNED' && isAiCoursePlan(p))
      .forEach((p) => {
        const key = new Date(p.dateAt).toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(p);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, ps]) => ({
        dateKey,
        plans: ps.sort((a, b) => (a.memo ?? '').localeCompare(b.memo ?? '')),
      }));
  })();

  const aiCourseDone: AiCourseGroup[] = (() => {
    const map: Record<string, DatePlan[]> = {};
    plans
      .filter((p) => p.status !== 'PLANNED' && isAiCoursePlan(p))
      .forEach((p) => {
        const key = new Date(p.dateAt).toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(p);
      });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, ps]) => ({ dateKey, plans: ps }));
  })();

  const handleStatusChange = async (id: string, status: DatePlanStatus) => {
    try {
      await coupleService.updateDatePlan(id, { status });
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

      // 완료 처리 시 추억 사진 업로드 유도
      if (status === 'COMPLETED') {
        const planTitle = plans.find((p) => p.id === id)?.title ?? '데이트';
        setTimeout(() => {
          Alert.alert(
            '🎉 데이트 완료!',
            `"${planTitle}" 데이트를 완료했어요!\n추억 사진을 남겨볼까요?`,
            [
              { text: '나중에', style: 'cancel' },
              {
                text: '사진 추가하기',
                onPress: () => pickMemoryPhoto(planTitle),
              },
            ]
          );
        }, 400);
      }
    } catch {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };

  const pickMemoryPhoto = async (caption: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;

    setMemoryUploading(true);
    try {
      await coupleService.uploadMemory({
        imageBase64: result.assets[0].base64,
        caption,
      });
      Alert.alert('💝 추억 저장 완료', '추억 탭에서 확인할 수 있어요!');
    } catch {
      Alert.alert('오류', '사진 업로드에 실패했습니다.');
    } finally {
      setMemoryUploading(false);
    }
  };

  const handleAI = () => {
    setAiNote('');
    setAiNoteVisible(true);
  };

  const startAI = () => {
    setAiNoteVisible(false);
    const params = aiNote.trim() ? `?userNote=${encodeURIComponent(aiNote.trim())}` : '';
    router.push(`/couple/ai-analysis${params}` as any);
  };

  if (loading) return <ActivityIndicator color="#E60076" style={{ marginTop: 48 }} />;

  return (
    <View style={{ flex: 1 }}>
      {/* AI 분석 안내 카드 */}
      <View style={styles.aiInfoCard}>
        <View style={styles.aiInfoTop}>
          <View style={styles.aiInfoLeft}>
            <View style={styles.aiInfoIconWrap}>
              <Sparkles size={20} color="#9810FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiInfoTitle}>AI 데이트 코스 분석</Text>
              <Text style={styles.aiInfoDesc}>
                {'요청사항 + 두 사람 취향을 분석해\n카카오 실제 장소로 하루 코스를 만들어드려요!'}
              </Text>
            </View>
          </View>
          <View style={styles.aiInfoRight}>
            <View style={styles.aiCreditBadge}>
              <Coins size={11} color="#9810FA" />
              <Text style={styles.aiCreditText}>15크레딧</Text>
            </View>
            <TouchableOpacity style={styles.aiStartBtn} onPress={handleAI}>
              <Text style={styles.aiStartBtnText}>시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* 분석 소스 칩 */}
        <View style={styles.aiInfoSources}>
          <Text style={styles.aiInfoSourcesLabel}>분석 기반</Text>
          <View style={styles.aiInfoChips}>
            <View style={styles.aiInfoChip}><Text style={styles.aiInfoChipTxt}>✏️ 직접 입력 요청사항</Text></View>
            <View style={styles.aiInfoChip}><Text style={styles.aiInfoChipTxt}>🔖 두 사람 북마크</Text></View>
            <View style={styles.aiInfoChip}><Text style={styles.aiInfoChipTxt}>📅 데이트 기록</Text></View>
            <View style={styles.aiInfoChip}><Text style={styles.aiInfoChipTxt}>📍 카카오 실제 장소</Text></View>
          </View>
        </View>
      </View>

      {/* AI 대화형 데이트 비서 (프리미엄 전용) */}
      <TouchableOpacity
        style={[styles.aiChatBtn, !isPremium && styles.aiChatBtnLocked]}
        onPress={() => {
          if (!isPremium) { router.push('/subscription'); return; }
          router.push('/couple/ai-date-chat');
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.aiChatBtnIcon}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiChatBtnTitle}>AI 대화형 데이트 비서{!isPremium ? ' 👑' : ''}</Text>
          <Text style={styles.aiChatBtnSub}>자유롭게 대화하며 데이트를 계획해봐요</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.dateActionRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/couple/date-plan-form' as any)}
        >
          <Plus size={17} color={Colors.white} />
          <Text style={styles.addBtnText}>플랜 추가</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.howToBtn} onPress={() => setHowToVisible(true)}>
          <Text style={styles.howToBtnText}>?</Text>
        </TouchableOpacity>
      </View>

      <DateHowToModal visible={howToVisible} onClose={() => setHowToVisible(false)} />

      {/* AI 노트 입력 모달 */}
      <Modal visible={aiNoteVisible} transparent animationType="fade" onRequestClose={() => setAiNoteVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.aiNoteBackdrop} activeOpacity={1} onPress={() => setAiNoteVisible(false)}>
            <TouchableOpacity activeOpacity={1} onPress={(e: any) => e.stopPropagation()}>
              <View style={styles.aiNoteSheet}>
                <View style={styles.aiNoteHdr}>
                  <LinearGradient colors={['#9810FA','#E60076']} style={styles.aiNoteIconWrap} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <Sparkles size={18} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiNoteTitle}>AI 데이트 코스 만들기</Text>
                    <Text style={styles.aiNoteSub}>지역·분위기 등 요청사항을 적으면 최우선 반영해요</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAiNoteVisible(false)}><X size={18} color={Colors.gray[400]} /></TouchableOpacity>
                </View>
                <TextInput
                  style={styles.aiNoteInput}
                  placeholder={'예) 서울숲 근처, 조용한 분위기\n첫 기념일이라 특별하게 하고 싶어요'}
                  placeholderTextColor={Colors.gray[400]}
                  multiline
                  maxLength={200}
                  value={aiNote}
                  onChangeText={setAiNote}
                />
                {/* 자동 분석 기반 안내 */}
                <View style={styles.aiNoteSourceRow}>
                  <Text style={styles.aiNoteSourceLabel}>자동으로 같이 분석 →</Text>
                  <View style={styles.aiNoteSourceChips}>
                    <View style={styles.aiNoteSourceChip}><Text style={styles.aiNoteSourceChipTxt}>🔖 북마크</Text></View>
                    <View style={styles.aiNoteSourceChip}><Text style={styles.aiNoteSourceChipTxt}>📅 데이트 기록</Text></View>
                    <View style={styles.aiNoteSourceChip}><Text style={styles.aiNoteSourceChipTxt}>📍 카카오 실장소</Text></View>
                  </View>
                </View>
                <View style={styles.aiNoteFooter}>
                  <View style={styles.aiNoteCreditBadge}>
                    <Coins size={12} color="#9810FA" />
                    <Text style={styles.aiNoteCreditTxt}>15크레딧 소모</Text>
                  </View>
                  <TouchableOpacity style={styles.aiNoteStartBtn} onPress={startAI}>
                    <LinearGradient colors={['#9810FA','#E60076']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.aiNoteStartGrad}>
                      <Text style={styles.aiNoteStartTxt}>코스 만들기</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <AiCourseDetailModal
        group={detailGroup}
        visible={!!detailGroup}
        onClose={() => setDetailGroup(null)}
        onStatusChange={handleStatusChange}
      />

      {plans.length === 0 ? (
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
          <View style={styles.dateGuideWrap}>
            <Text style={styles.dateGuideHeading}>💡 이렇게 활용해보세요</Text>
            {DATE_HOW_TO_STEPS.map((step, i) => (
              <View key={i} style={[styles.dateGuideCard, { borderLeftColor: step.color }]}>
                <View style={[styles.dateGuideEmoji, { backgroundColor: step.bg }]}>
                  <Text style={{ fontSize: 20 }}>{step.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.howToItemHeader}>
                    <View style={[styles.howToStep, { backgroundColor: step.bg }]}>
                      <Text style={[styles.howToStepText, { color: step.color }]}>STEP {i + 1}</Text>
                    </View>
                    <Text style={styles.dateGuideCardTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.dateGuideCardDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtnLarge}
              onPress={() => router.push('/couple/date-plan-form' as any)}
            >
              <Plus size={18} color={Colors.white} />
              <Text style={styles.addBtnText}>첫 번째 플랜 추가하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {/* AI 데이트 코스 예정 섹션 */}
          {aiCoursePlanned.length > 0 && (
            <View>
              <View style={styles.planSectionHeader}>
                <LinearGradient colors={['#9810FA','#E60076']} style={[styles.planSectionDot, { width: 10, height: 10, borderRadius: 5 }]} />
                <Text style={[styles.planSectionTitle, { color: '#9810FA' }]}>AI 데이트 코스</Text>
                <Text style={styles.planSectionCount}>{aiCoursePlanned.reduce((s, g) => s + g.plans.length, 0)}</Text>
              </View>
              {aiCoursePlanned.map((group) => (
                <AiCoursePlanGroup
                  key={group.dateKey}
                  group={group}
                  onStatusChange={handleStatusChange}
                  onOpenDetail={() => setDetailGroup(group)}
                />
              ))}
            </View>
          )}

          {/* 예정 섹션 */}
          {planned.length > 0 && (
            <View style={aiCoursePlanned.length > 0 ? { marginTop: 8 } : undefined}>
              <View style={styles.planSectionHeader}>
                <View style={[styles.planSectionDot, { backgroundColor: '#9810FA' }]} />
                <Text style={styles.planSectionTitle}>예정된 데이트</Text>
                <Text style={styles.planSectionCount}>{planned.length}</Text>
              </View>
              {planned.map((plan) => (
                <DatePlanCard
                  key={plan.id}
                  plan={plan}
                  onStatusChange={handleStatusChange}
                  onPress={() => router.push({ pathname: '/couple/date-plan-form' as any, params: { id: plan.id, title: plan.title, dateAt: plan.dateAt, memo: plan.memo ?? '' } })}
                />
              ))}
            </View>
          )}

          {/* 완료·취소 섹션 */}
          {(done.length > 0 || aiCourseDone.length > 0) && (
            <View style={(planned.length > 0 || aiCoursePlanned.length > 0) ? { marginTop: 8 } : undefined}>
              <View style={styles.planSectionHeader}>
                <View style={[styles.planSectionDot, { backgroundColor: Colors.gray[400] }]} />
                <Text style={[styles.planSectionTitle, { color: Colors.gray[500] }]}>완료 · 취소</Text>
                <Text style={styles.planSectionCount}>{done.length + aiCourseDone.reduce((s, g) => s + g.plans.length, 0)}</Text>
              </View>
              {aiCourseDone.map((group) => (
                <AiCoursePlanGroup
                  key={group.dateKey + '-done'}
                  group={group}
                  onStatusChange={handleStatusChange}
                  onOpenDetail={() => setDetailGroup(group)}
                />
              ))}
              {done.map((plan) => (
                <DatePlanCard
                  key={plan.id}
                  plan={plan}
                  onPress={() => router.push({ pathname: '/couple/date-plan-form' as any, params: { id: plan.id, title: plan.title, dateAt: plan.dateAt, memo: plan.memo ?? '' } })}
                />
              ))}
            </View>
          )}

          {memoryUploading && (
            <View style={styles.memoryUploadingBanner}>
              <ActivityIndicator size="small" color="#9810FA" />
              <Text style={styles.memoryUploadingText}>추억 사진 저장 중...</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── 추억 탭 ───────────────────────────────────────────────────────────────────
function MemoryTab({ myUserId }: { myUserId: string }) {
  const [memories, setMemories] = useState<CoupleMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // 캡션 모달
  const [captionModal, setCaptionModal] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);

  // 풀스크린 모달
  const [fullscreenMemory, setFullscreenMemory] = useState<CoupleMemory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      const res = await coupleService.getMemories(p);
      if (p === 1) setMemories(res.items);
      else setMemories((prev) => [...prev, ...res.items]);
      setHasNext(res.hasNext);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;
    setPendingBase64(result.assets[0].base64);
    setCaptionText('');
    setCaptionModal(true);
  };

  const handleUpload = async () => {
    if (!pendingBase64) return;
    setCaptionModal(false);
    setUploading(true);
    try {
      await coupleService.uploadMemory({
        imageBase64: pendingBase64,
        caption: captionText.trim() || undefined,
      });
      load(1);
    } catch {
      Alert.alert('오류', '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setPendingBase64(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await coupleService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setFullscreenMemory(null);
    } catch {
      Alert.alert('오류', '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <ActivityIndicator color="#E60076" style={{ marginTop: 48 }} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.memoryActionRow}>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}
          onPress={pickImage}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={styles.uploadBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {uploading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <><Camera size={15} color={Colors.white} /><Text style={styles.uploadBtnText}>사진 추가</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {memories.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Camera size={44} color={Colors.gray[200]} />
          <Text style={styles.emptyTitle}>첫 번째 추억을 기록해보세요 📸</Text>
          <Text style={styles.emptyDesc}>사진을 추가하면 여기에 표시됩니다</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
            if (hasNext && layoutMeasurement.height + contentOffset.y >= contentSize.height - 100) {
              load(page + 1);
            }
          }}
          scrollEventThrottle={400}
        >
          <MemoryGrid
            memories={memories}
            myUserId={myUserId}
            onPress={(memory) => setFullscreenMemory(memory)}
          />
        </ScrollView>
      )}

      {/* 캡션 입력 모달 */}
      <Modal visible={captionModal} transparent animationType="slide" onRequestClose={() => setCaptionModal(false)}>
        <Pressable style={styles.reportOverlay} onPress={() => setCaptionModal(false)}>
          <Pressable style={styles.reportSheet} onPress={() => {}}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>📸 추억 사진 추가</Text>
            <Text style={styles.reportSubtitle}>이 순간을 기억할 한 마디를 남겨보세요</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="캡션 입력 (선택)"
              placeholderTextColor={Colors.gray[300]}
              value={captionText}
              onChangeText={setCaptionText}
              maxLength={100}
              returnKeyType="done"
            />
            <View style={styles.captionBtnRow}>
              <TouchableOpacity
                style={styles.captionSkipBtn}
                onPress={() => { setCaptionText(''); handleUpload(); }}
              >
                <Text style={styles.captionSkipText}>건너뛰기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captionSubmitBtn} onPress={handleUpload}>
                <Text style={styles.captionSubmitText}>추가하기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 풀스크린 프리뷰 모달 */}
      <Modal
        visible={!!fullscreenMemory}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenMemory(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenMemory(null)}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          {fullscreenMemory && (
            <>
              <Image
                source={{ uri: fullscreenMemory.imageUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.fullscreenInfo}>
                {fullscreenMemory.caption && (
                  <Text style={styles.fullscreenCaption}>{fullscreenMemory.caption}</Text>
                )}
                <Text style={styles.fullscreenDate}>
                  {new Date(fullscreenMemory.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Text>
                {fullscreenMemory.uploaderId === myUserId && (
                  <TouchableOpacity
                    style={[styles.fullscreenDeleteBtn, deleting && { opacity: 0.5 }]}
                    onPress={() => {
                      Alert.alert('삭제', '이 추억을 삭제하시겠습니까?', [
                        { text: '취소', style: 'cancel' },
                        { text: '삭제', style: 'destructive', onPress: () => handleDelete(fullscreenMemory.id) },
                      ]);
                    }}
                    disabled={deleting}
                  >
                    {deleting
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.fullscreenDeleteText}>삭제</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ── 채팅 탭 ───────────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ['❤️', '😘', '😊', '✨', '🎉', '🥰'];

function ChatTab({ myUserId }: { myUserId: string }) {
  const insets = useSafeAreaInsets();
  const { chatMessages, setChatMessages, prependChatMessage } = useCoupleStore();
  const [loading, setLoading] = useState(chatMessages.length === 0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await coupleService.getMessages(1, 50);
      setChatMessages(res.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [setChatMessages]);

  useEffect(() => {
    loadMessages();
    coupleService.markMessagesRead().catch(() => {});
    pollRef.current = setInterval(() => {
      coupleService.getMessages(1, 50)
        .then((res) => setChatMessages(res.items))
        .catch(() => {});
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages, setChatMessages]);

  const sendText = async () => {
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    setText('');
    try {
      const newMsg = await coupleService.sendMessage({ type: 'TEXT', text: msg });
      prependChatMessage(newMsg);
    } catch {
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally { setSending(false); }
  };

  const sendEmoji = async (emoji: string) => {
    try {
      const newMsg = await coupleService.sendMessage({ type: 'EMOJI', emoji });
      prependChatMessage(newMsg);
    } catch { /* ignore */ }
  };

  const sendImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;
    try {
      const newMsg = await coupleService.sendMessage({ type: 'IMAGE', imageBase64: result.assets[0].base64 });
      prependChatMessage(newMsg);
    } catch {
      Alert.alert('오류', '이미지 전송에 실패했습니다.');
    }
  };

  const renderItem = ({ item }: { item: CoupleMessage }) => {
    const isMine = item.senderId === myUserId;
    const time = new Date(item.createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit',
    });
    const isRead = !!item.readAt;

    if (item.type === 'EMOJI') {
      return (
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          <Text style={{ fontSize: 38 }}>{item.emoji}</Text>
          <Text style={styles.msgTime}>{time}{isMine && isRead ? ' ✓' : ''}</Text>
        </View>
      );
    }

    if (item.type === 'IMAGE' && item.imageUrl) {
      return (
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          <Image source={{ uri: item.imageUrl }} style={styles.msgImage} />
          <Text style={styles.msgTime}>{time}{isMine && isRead ? ' ✓' : ''}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubblePartner]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextPartner]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.msgTime}>{time}{isMine && isRead ? ' ✓' : ''}</Text>
      </View>
    );
  };

  if (loading && chatMessages.length === 0) {
    return <ActivityIndicator color="#E60076" style={{ marginTop: 48 }} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 110}
    >
      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.chatEmptyWrap}>
            <MessageCircle size={48} color={Colors.gray[200]} />
            <Text style={styles.emptyTitle}>대화를 시작해보세요 💕</Text>
            <Text style={styles.emptyDesc}>아래 이모지로 첫 메시지를 보내보세요</Text>
          </View>
        }
      />

      {/* 이모지 빠른 선택 */}
      <View style={styles.quickEmojiRow}>
        {QUICK_EMOJIS.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => sendEmoji(emoji)} style={styles.quickEmojiBtn}>
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 입력 바 */}
      <View style={styles.chatInputBar}>
        <TouchableOpacity onPress={sendImage} style={styles.chatIconBtn}>
          <Camera size={20} color={Colors.gray[400]} />
        </TouchableOpacity>
        <TextInput
          style={styles.chatInput}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={Colors.gray[300]}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendText}
          style={[styles.chatSendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
          disabled={!text.trim() || sending}
        >
          <Send size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
const TABS: { key: CoupleTab; label: string }[] = [
  { key: 'home',   label: '홈' },
  { key: 'scrap',  label: '스크랩' },
  { key: 'date',   label: '데이트' },
  { key: 'memory', label: '추억' },
  { key: 'chat',   label: '채팅' },
];

export default function CoupleLoungeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const { coupleInfo, setCoupleInfo } = useCoupleStore();

  const [activeTab, setActiveTab] = useState<CoupleTab>('home');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [receivedInvitations, setReceivedInvitations] = useState<CoupleInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<CoupleInvitation[]>([]);
  const [invLoading, setInvLoading] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | undefined>();
  const [nextPlan, setNextPlan] = useState<DatePlan | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [showDissolveComplete, setShowDissolveComplete] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (coupleInfo) {
        const [profile, plans] = await Promise.all([
          coupleService.getPartnerProfile().catch(() => undefined),
          coupleService.getDatePlans().catch(() => []),
        ]);
        setPartnerProfile(profile);
        const upcoming = plans
          .filter((p) => p.status === 'PLANNED' && new Date(p.dateAt) >= new Date())
          .sort((a, b) => new Date(a.dateAt).getTime() - new Date(b.dateAt).getTime());
        setNextPlan(upcoming[0]);
      } else {
        const [recv, sent] = await Promise.all([
          coupleService.getReceivedInvitations().catch(() => []),
          coupleService.getSentInvitations().catch(() => []),
        ]);
        setReceivedInvitations(recv.filter((i) => i.status === 'PENDING'));
        setSentInvitations(sent.filter((i) => i.status === 'PENDING'));
      }
    } catch { /* ignore */ }
    finally { setInitialLoading(false); setRefreshing(false); }
  }, [coupleInfo]);

  useEffect(() => { loadData(); }, [loadData]);

  // 보낸 초대가 있을 때 8초마다 폴링 → 상대가 수락하면 커플 화면으로 전환
  useEffect(() => {
    if (coupleInfo || sentInvitations.length === 0) return;
    const timer = setInterval(async () => {
      try {
        const u = await authService.getMe();
        if (u?.couple) {
          setUser(u);
          setCoupleInfo(u.couple);
        }
      } catch { /* 무시 */ }
    }, 8000);
    return () => clearInterval(timer);
  }, [coupleInfo, sentInvitations.length, setUser, setCoupleInfo]);

  const handleAccept = async (id: string) => {
    setInvLoading(id);
    try {
      await coupleService.respondToInvitation(id, true);
      const u = await authService.getMe();
      setUser(u);
      if (u?.couple) setCoupleInfo(u.couple);
      setReceivedInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '수락에 실패했습니다.');
    } finally { setInvLoading(null); }
  };

  const handleReject = async (id: string) => {
    setInvLoading(id);
    try {
      await coupleService.respondToInvitation(id, false);
      setReceivedInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch {
      Alert.alert('오류', '거절에 실패했습니다.');
    } finally { setInvLoading(null); }
  };

  const handleCancel = async (id: string) => {
    setInvLoading(id);
    try {
      await coupleService.cancelInvitation(id);
      setSentInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch {
      Alert.alert('오류', '취소에 실패했습니다.');
    } finally { setInvLoading(null); }
  };

  const handleDissolve = () => {
    Alert.alert(
      '커플 해제',
      '파트너와의 연결을 해제할게요.\n해제 후에도 함께한 추억은 기록에 남아 있어요.\n\n정말 헤어지시겠어요? 💔',
      [
        { text: '아니요, 계속할게요', style: 'cancel' },
        {
          text: '네, 해제할게요',
          style: 'destructive',
          onPress: async () => {
            try {
              await coupleService.dissolveCouple();
              setShowDissolveComplete(true);
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? e?.message ?? '알 수 없는 오류';
              Alert.alert('오류', `커플 해제에 실패했습니다.\n(${msg})`);
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      {/* 커플 상태일 때 배경 하트 애니메이션 */}
      {coupleInfo && <BackgroundHearts />}

      {/* Safe Area top */}
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          onBack={() => router.back()}
          rightAction={
            coupleInfo ? (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setReportTarget({ id: coupleInfo.partnerId, name: coupleInfo.partnerName })}
                  style={styles.reportIconBtn}
                >
                  <Flag size={14} color={Colors.gray[400]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDissolve} style={styles.dissolveBtn}>
                  <Text style={styles.dissolveBtnText}>해제</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      </View>

      {/* 로딩 */}
      {initialLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#E60076" size="large" />
        </View>
      ) : coupleInfo ? (
        <>
          {/* 탭 바 */}
          <View style={styles.tabBar}>
            {TABS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.tabBtn}
                onPress={() => setActiveTab(key)}
              >
                <Text style={[styles.tabBtnText, activeTab === key && styles.tabBtnTextActive]}>
                  {label}
                </Text>
                {activeTab === key && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* 탭 콘텐츠 */}
          <View style={{ flex: 1 }}>
            {activeTab === 'home' && (
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); loadData(); }}
                    tintColor="#E60076"
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                <HomeTab
                  coupleInfo={coupleInfo}
                  partnerProfile={partnerProfile}
                  nextPlan={nextPlan}
                />
              </ScrollView>
            )}
            {activeTab === 'scrap'  && <ScrapTab />}
            {activeTab === 'date'   && <DateTab />}
            {activeTab === 'memory' && user && <MemoryTab myUserId={user.id} />}
            {user && (
              <View style={{ flex: 1, display: activeTab === 'chat' ? 'flex' : 'none' }}>
                <ChatTab myUserId={user.id} />
              </View>
            )}
          </View>
        </>
      ) : (
        <LandingView
          gender={user?.gender}
          onInvite={() => setInviteModalVisible(true)}
          received={receivedInvitations}
          sent={sentInvitations}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
          onReport={(id, name) => setReportTarget({ id, name })}
          invLoading={invLoading}
        />
      )}

      <CoupleInviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onInviteSent={() => loadData()}
      />

      {reportTarget && (
        <ReportModal
          visible
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* 커플 해제 완료 모달 */}
      <Modal
        visible={showDissolveComplete}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.dissolveCompleteOverlay}>
          <View style={styles.dissolveCompleteCard}>
            <Text style={styles.dissolveCompleteEmoji}>💔</Text>
            <Text style={styles.dissolveCompleteTitle}>커플이 해제되었어요</Text>
            <Text style={styles.dissolveCompleteDesc}>
              함께했던 시간은 소중한 추억으로{`\n`}앱에 기록되어 있어요
            </Text>
            <TouchableOpacity
              style={styles.dissolveCompleteBtn}
              activeOpacity={0.85}
              onPress={() => {
                setShowDissolveComplete(false);
                setCoupleInfo(null);
              }}
            >
              <Text style={styles.dissolveCompleteBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── 배경 하트 애니메이션
  bgHeartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  // ── 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBackWrap: {
    width: 80,
    alignItems: 'flex-start',
  },
  headerBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  headerRight: {
    width: 80,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  dissolveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  dissolveBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.gray[500],
  },

  // ── 커플 해제 완료 모달
  dissolveCompleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  dissolveCompleteCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    ...Shadow.lg,
  },
  dissolveCompleteEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  dissolveCompleteTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.sm,
  },
  dissolveCompleteDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
  },
  dissolveCompleteBtn: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.md,
  },
  dissolveCompleteBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  reportIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // ── 하트 애니메이션 (랜딩)
  heartsContainer: {
    position: 'absolute',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },

  // ── 신고 모달
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  reportSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  reportHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  reportSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
    textAlign: 'center',
    marginBottom: 20,
  },
  reportReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reportReasonBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  reportReasonBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  reportReasonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[500],
  },
  reportReasonTextActive: {
    color: '#DC2626',
    fontWeight: FontWeight.semibold,
  },
  reportDetailInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: 14,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    marginBottom: 12,
  },
  reportImgLabel: { fontSize: FontSize.xs, color: Colors.gray[500], marginBottom: 8 },
  reportImgRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  reportImgThumbWrap: { position: 'relative' as const },
  reportImgThumb: { width: 70, height: 70, borderRadius: BorderRadius.lg },
  reportImgRemove: {
    position: 'absolute' as const, top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  reportImgAdd: {
    width: 70, height: 70, borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.gray[200], borderStyle: 'dashed' as const,
    alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.gray[50],
  },
  reportLegalNote: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: 16,
  },
  reportLegalText: {
    fontSize: 11,
    color: '#DC2626',
    lineHeight: 16,
    textAlign: 'center',
  },
  reportSubmitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.xl,
    paddingVertical: 15,
    alignItems: 'center',
  },
  reportSubmitText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 탭 바
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.gray[400],
  },
  tabBtnTextActive: {
    color: '#E60076',
    fontWeight: FontWeight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#E60076',
  },

  // ── 탭 공통 컨텐츠
  tabContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
    paddingTop: 4,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },

  // ── 랜딩 히어로
  landingScroll: {
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  heroEmojiWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadow.md,
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.gray[900],
    textAlign: 'center',
    lineHeight: 32,
  },
  heroDesc: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  inviteBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadow.md,
  },
  inviteBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: 16,
  },
  inviteBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // ── 기능 그리드
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureCard: {
    width: '47.5%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  featureIcon: {
    fontSize: 30,
  },
  featureLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── 구독 전용 AI 카드
  featurePremiumCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    ...Shadow.sm,
  },
  featurePremiumLeft: {
    flex: 1,
    gap: 5,
  },
  featurePremiumBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#9810FA',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 2,
  },
  featurePremiumBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  featurePremiumLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  featurePremiumDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    lineHeight: 17,
  },
  featurePremiumEmoji: {
    fontSize: 42,
    marginLeft: Spacing.md,
  },

  // ── 초대 섹션
  invitationsSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[500],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  // ── 기념일 D+N 카드
  anniversaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    ...Shadow.md,
  },
  anniversaryDayLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  anniversaryDayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  anniversaryDayNum: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  anniversaryDateStr: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  anniversaryEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-end',
  },
  anniversaryEditText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeight.medium,
  },
  anniversaryEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderStyle: 'dashed',
  },
  anniversaryEmptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[800],
  },
  anniversaryEmptyDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    marginTop: 2,
  },

  // ── 달력
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeaderText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  calDayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[400],
    paddingVertical: 4,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  calCellSel: {
    backgroundColor: '#9810FA',
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: '#9810FA',
  },
  calCellText: {
    fontSize: FontSize.sm,
    color: Colors.gray[800],
  },
  calCellDisabled: {
    color: Colors.gray[200],
  },
  calCellSelText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  calCellTodayText: {
    color: '#9810FA',
    fontWeight: FontWeight.bold,
  },

  // ── 홈 탭 - 크레딧 선물
  giftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E60076',
    ...Shadow.sm,
  },
  giftBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#E60076',
  },
  creditHistoryBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    ...Shadow.sm,
  },
  creditHistoryTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  creditHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
  },
  creditHistoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  creditHistoryText: {
    fontSize: FontSize.xs,
    color: Colors.gray[700],
    fontWeight: FontWeight.medium,
  },
  creditHistoryDate: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
  creditHistoryAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginLeft: 'auto',
  },
  giftAmountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  giftAmountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.gray[50],
    borderWidth: 1.5,
    borderColor: Colors.gray[100],
  },
  giftAmountBtnActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#E60076',
  },
  giftAmountText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[400],
  },
  giftAmountTextActive: {
    color: '#E60076',
  },
  giftSubmitBtn: {
    backgroundColor: '#E60076',
    borderRadius: BorderRadius.xl,
    paddingVertical: 15,
    alignItems: 'center',
  },

  // ── 스크랩 탭 세그먼트
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 4,
    ...Shadow.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FDF2F8',
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[400],
  },
  segmentTextActive: {
    color: '#E60076',
    fontWeight: FontWeight.bold,
  },

  // ── 플레이스 카드
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  placeCardImg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
  },
  placeCardInfo: { flex: 1 },
  placeCardName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  placeCardAddr: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    marginTop: 2,
  },

  // ── AI 대화형 데이트 비서 버튼
  aiChatBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiChatBtnLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: Colors.gray[200],
  },
  aiChatBtnIcon: { fontSize: 24 },
  aiChatBtnTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#6D28D9' },
  aiChatBtnSub: { fontSize: FontSize.xs, color: Colors.gray[500], marginTop: 2 },

  // ── 데이트 탭 - AI 안내 카드
  aiInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Shadow.sm,
  },
  aiInfoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiInfoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  aiInfoSources: {
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    paddingTop: 10,
    gap: 6,
  },
  aiInfoSourcesLabel: {
    fontSize: 10,
    color: Colors.gray[400],
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  aiInfoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiInfoChip: {
    backgroundColor: '#F5F0FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiInfoChipTxt: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: FontWeight.medium,
  },
  aiInfoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInfoTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  aiInfoDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    lineHeight: 16,
  },
  aiInfoRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
    marginLeft: 8,
  },
  aiCreditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  aiCreditText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#9810FA',
  },
  aiStartBtn: {
    backgroundColor: '#9810FA',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aiStartBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  dateActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E60076',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    ...Shadow.sm,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  howToBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  howToBtnText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.gray[500],
  },
  howToSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 36,
    maxHeight: '80%',
    ...Shadow.lg,
  },
  howToOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  howToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  howToCloseX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  howToTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    flex: 1,
    marginBottom: 0,
  },
  howToItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
  },
  howToEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howToItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  howToStep: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  howToStepText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  howToItemTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  howToItemDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  howToCloseBtn: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  howToCloseBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[600],
  },
  dateGuideWrap: {
    gap: 10,
  },
  dateGuideHeading: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[500],
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  dateGuideCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderLeftWidth: 3,
    ...Shadow.sm,
  },
  dateGuideEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateGuideCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  dateGuideCardDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    lineHeight: 17,
    marginTop: 2,
  },
  addBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E60076',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    marginTop: 8,
    ...Shadow.sm,
  },
  planSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 4,
  },
  planSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  planSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
    flex: 1,
  },
  planSectionCount: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    fontWeight: FontWeight.medium,
  },
  // AI 코스 카드
  aiCourseCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#9810FA',
    ...Shadow.sm,
    overflow: 'hidden',
  },
  aiCourseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aiCourseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiCourseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCourseTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  aiCourseDateTxt: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 1,
  },
  aiCourseDDay: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  aiCourseDDayTxt: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  aiCourseDoneBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  aiCourseDoneTxt: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#16A34A',
  },
  aiCourseBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 10,
    gap: 0,
  },
  aiCourseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  aiCourseLeft: {
    width: 44,
    alignItems: 'center',
  },
  aiCourseTime: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#9810FA',
    marginBottom: 3,
  },
  aiCourseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9810FA',
  },
  aiCourseLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E9D5FF',
    marginTop: 2,
    marginBottom: 0,
    minHeight: 12,
  },
  aiCourseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  aiCourseItemTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[800],
  },
  aiCourseCheckBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiCourseDoneChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // AI 코스 상세 모달
  aiDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  aiDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiDetailTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  aiDetailDateTxt: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
  },
  aiDetailScroll: {
    flex: 1,
  },
  aiDetailContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  aiDetailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aiDetailLeft: {
    width: 48,
    alignItems: 'center',
  },
  aiDetailTime: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: '#9810FA',
    marginBottom: 4,
  },
  aiDetailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9810FA',
  },
  aiDetailLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E9D5FF',
    marginTop: 3,
    minHeight: 16,
  },
  aiDetailRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 20,
    gap: 8,
  },
  aiDetailPlace: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
    lineHeight: 22,
  },
  aiDetailTip: {
    fontSize: 12,
    color: Colors.gray[400],
    lineHeight: 18,
    marginTop: 2,
  },
  memoryUploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F5F0FF',
    borderRadius: BorderRadius.lg,
    marginTop: 8,
  },
  memoryUploadingText: {
    fontSize: FontSize.sm,
    color: '#9810FA',
    fontWeight: FontWeight.medium,
  },

  // ── 추억 탭
  memoryActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  uploadBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  uploadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
  },
  uploadBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // ── 캡션 모달
  captionInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: 14,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    borderWidth: 1,
    borderColor: Colors.gray[100],
    marginBottom: 16,
  },
  captionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  captionSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  captionSkipText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.gray[500],
  },
  captionSubmitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    backgroundColor: '#E60076',
  },
  captionSubmitText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // ── 풀스크린 모달
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  fullscreenInfo: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 8,
    alignItems: 'center',
  },
  fullscreenCaption: {
    fontSize: FontSize.base,
    color: Colors.white,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  fullscreenDate: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  fullscreenDeleteBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(220,38,38,0.8)',
  },
  fullscreenDeleteText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // ── 채팅 탭
  chatList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  chatEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  msgRow: {
    marginVertical: 4,
    maxWidth: '78%',
    gap: 3,
  },
  msgRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#E60076',
    borderBottomRightRadius: 4,
  },
  bubblePartner: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  bubbleText: {
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: Colors.white,
  },
  bubbleTextPartner: {
    color: Colors.gray[900],
  },
  msgTime: {
    fontSize: 10,
    color: Colors.gray[400],
  },
  msgImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
  },
  quickEmojiRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    justifyContent: 'space-around',
  },
  quickEmojiBtn: {
    padding: 6,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    gap: 8,
    paddingBottom: 16,
  },
  chatIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E60076',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 공통 Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[400],
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[300],
    textAlign: 'center',
  },
  // AI Note Modal
  aiNoteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  aiNoteSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  aiNoteHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiNoteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiNoteTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  aiNoteSub: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    marginTop: 2,
  },
  aiNoteInput: {
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    fontSize: FontSize.sm,
    color: Colors.gray[900],
    minHeight: 90,
    textAlignVertical: 'top',
  },
  aiNoteSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  aiNoteSourceLabel: {
    fontSize: 10,
    color: Colors.gray[400],
    flexShrink: 0,
  },
  aiNoteSourceChips: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  aiNoteSourceChip: {
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  aiNoteSourceChipTxt: {
    fontSize: 10,
    color: Colors.gray[500],
    fontWeight: FontWeight.medium,
  },
  aiNoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiNoteCreditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiNoteCreditTxt: {
    fontSize: FontSize.xs,
    color: '#9810FA',
    fontWeight: FontWeight.semibold,
  },
  aiNoteStartBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiNoteStartGrad: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiNoteStartTxt: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
});
