import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Share, Linking, Platform, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, useWindowDimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Clock, Phone, Star, Users,
  Navigation, Heart, MessageSquare, X,
} from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { placeService } from '@services/place.service';
import ShareIcon from '@assets/Share.svg';
import ThumsIcon from '@assets/Thums.svg';
import type { PlaceDetail, PlaceReview } from '@/types';

const IMAGE_HEIGHT = 320;

// ─── 감정 바 항목 ─────────────────────────────────────────────────────────────
function EmotionBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.vibeBarRow}>
      <Text style={styles.vibeBarLabel}>{label}</Text>
      <View style={styles.vibeBarTrack}>
        <View style={[styles.vibeBarFill, { width: `${value}%` as `${number}%` }]} />
      </View>
      <Text style={styles.vibeBarValue}>{value}%</Text>
    </View>
  );
}

// ─── 추천 이유 카드 ────────────────────────────────────────────────────────────
function ReasonCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.reasonCard}>
      <LinearGradient
        colors={['#f3e8ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.reasonIcon}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.reasonTitle}>{title}</Text>
        <Text style={styles.reasonDesc}>{description}</Text>
      </View>
      <ThumsIcon width={20} height={20} />
    </View>
  );
}

// ─── 장소 정보 행 ─────────────────────────────────────────────────────────────
function InfoRow({
  Icon, label, value,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconWrap}>
        <Icon size={18} color={Colors.primary[600]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── 이름 익명화 ──────────────────────────────────────────────────────────────
function anonymizeName(name: string): string {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

// ─── 별점 선택 ────────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starPicker}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Star
            size={32}
            color="#FACC15"
            fill={n <= value ? '#FACC15' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── 리뷰 작성 모달 ────────────────────────────────────────────────────────────
function ReviewModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  initialRating = 5,
  initialBody = '',
  isEdit = false,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, body: string) => void;
  isPending: boolean;
  initialRating?: number;
  initialBody?: string;
  isEdit?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(initialRating);
  const [body, setBody] = useState(initialBody);

  // visible이 열릴 때마다 초기값 동기화
  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setBody(initialBody);
    }
  }, [visible, initialRating, initialBody]);

  const handleSubmit = () => {
    if (!body.trim()) return;
    onSubmit(rating, body.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? '리뷰 수정' : '리뷰 작성'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>별점을 선택해주세요</Text>
          <StarPicker value={rating} onChange={setRating} />

          <Text style={styles.modalSubtitle}>리뷰를 작성해주세요</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="이 장소에 대한 솔직한 후기를 남겨주세요"
            placeholderTextColor={Colors.gray[400]}
            multiline
            numberOfLines={4}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!body.trim() || isPending) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!body.trim() || isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.submitBtnText}>
              {isPending ? '제출 중...' : isEdit ? '수정 완료' : '리뷰 등록'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── 바이브 태그 색상 ──────────────────────────────────────────────────────────
const VIBE_COLORS = [
  { bg: '#f3e8ff', text: '#8200db' },
  { bg: '#fce7f3', text: '#c6005c' },
  { bg: '#dbeafe', text: '#1447e6' },
];

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // ── 데이터 패치 ────────────────────────────────────────────────────────
  const { data: place, isLoading, isError } = useQuery<PlaceDetail>({
    queryKey: ['place', id],
    queryFn: () => placeService.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (place?.isBookmarked !== undefined) {
      setIsBookmarked(place.isBookmarked);
    }
  }, [place?.isBookmarked]);

  // ── 즐겨찾기 토글 ──────────────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: () => placeService.toggleBookmark(id),
    onMutate: () => setIsBookmarked((prev) => !prev),
    onError: () => setIsBookmarked((prev) => !prev),
    onSuccess: (data) => {
      setIsBookmarked(data.isBookmarked);
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  // ── 리뷰 작성 ──────────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: ({ rating, body }: { rating: number; body: string }) =>
      placeService.addReview(id, rating, body),
    onSuccess: () => {
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['place', id] });
    },
  });

  // ── 공유 ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        message: `${place.name} - vibly에서 발견한 장소예요!\n📍 ${place.address}`,
        title: place.name,
      });
    } catch {}
  };

  // ── 길찾기 ──────────────────────────────────────────────────────────────
  const handleNavigate = () => {
    if (!place) return;
    const label = encodeURIComponent(place.name);
    const { lat, lng } = place;

    const kakaoAppUrl =
      Platform.OS === 'ios'
        ? `kakaomap://look?p=${lat},${lng}`
        : `kakaomap://look?p=${lat},${lng}`;

    const naverAppUrl =
      Platform.OS === 'ios'
        ? `nmap://navigation?dlat=${lat}&dlng=${lng}&dname=${label}&appname=com.vibly.app`
        : `nmap://navigation?dlat=${lat}&dlng=${lng}&dname=${label}&appname=com.vibly.app`;

    const kakaoWebUrl = `https://map.kakao.com/link/to/${label},${lat},${lng}`;

    const nativeUrl =
      Platform.OS === 'ios'
        ? `maps://?daddr=${lat},${lng}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    Alert.alert('길찾기', '사용할 앱을 선택하세요', [
      {
        text: '카카오맵',
        onPress: () =>
          Linking.openURL(kakaoAppUrl).catch(() =>
            Linking.openURL(kakaoWebUrl),
          ),
      },
      {
        text: '네이버 지도',
        onPress: () =>
          Linking.openURL(naverAppUrl).catch(() =>
            Linking.openURL(kakaoWebUrl),
          ),
      },
      {
        text: Platform.OS === 'ios' ? '애플 지도' : '구글 지도',
        onPress: () =>
          Linking.openURL(nativeUrl).catch(() =>
            Linking.openURL(kakaoWebUrl),
          ),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // ── 체크인 ──────────────────────────────────────────────────────────────
  const handleCheckin = () => {
    router.push({ pathname: '/checkin', params: { placeId: id } });
  };

  // ── 로딩 / 오류 상태 ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>장소를 불러오지 못했어요</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.lg }}>
          <Text style={{ color: Colors.primary[600], fontSize: FontSize.base }}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const emotions = place.emotionMatch ?? [];

  const vibeScore = place.vibeScore ?? emotions[0]?.value ?? 72;

  return (
    <ScreenTransition>
      {/* 배경색을 그라데이션 끝색으로 채워 하단 흰 여백 방지 */}
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 히어로 이미지 ─────────────────────────────────────────── */}
          <View style={{ height: IMAGE_HEIGHT }}>
            {place.imageUrl ? (
              <Image
                source={{ uri: place.imageUrl }}
                style={{ width, height: IMAGE_HEIGHT }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={Gradients.primary}
                style={{ width, height: IMAGE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.heroEmoji}>🏠</Text>
              </LinearGradient>
            )}
            {/* 상단 어둠 오버레이 */}
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent']}
              style={[StyleSheet.absoluteFill, { height: IMAGE_HEIGHT * 0.45 }]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>

          {/* ── 플로팅 버튼 ───────────────────────────────────────────── */}
          <View style={[styles.floatRow, { top: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
              <ArrowLeft size={20} color={Colors.gray[800]} />
            </TouchableOpacity>
            <View style={styles.floatRight}>
              <TouchableOpacity onPress={handleShare} style={styles.floatBtn}>
                <ShareIcon width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => bookmarkMutation.mutate()}
                style={[styles.floatBtn, isBookmarked && styles.floatBtnActive]}
                disabled={bookmarkMutation.isPending}
              >
                <Heart
                  size={20}
                  color={isBookmarked ? '#e60076' : Colors.gray[700]}
                  fill={isBookmarked ? '#e60076' : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 콘텐츠 시트 ──────────────────────────────────────────── */}
          <LinearGradient
            colors={['#faf5ff', '#fdf2f8', '#eff6ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contentSheet}
          >
            {/* 장소명 + 평점 */}
            <View style={styles.placeHeader}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeCategory}>
                  {place.category} · {place.address.split(' ').slice(1, 3).join(' ')}
                </Text>
              </View>
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                {/* Google 평점 */}
                {(place.googleRating ?? 0) > 0 && (
                  <View style={styles.ratingBadge}>
                    <Star size={14} color="#FACC15" fill="#FACC15" />
                    <View>
                      <Text style={styles.ratingText}>{place.googleRating!.toFixed(1)}</Text>
                      <Text style={styles.ratingLabel}>
                        구글{place.googleReviewCount ? ` ${place.googleReviewCount.toLocaleString()}개` : ''}
                      </Text>
                    </View>
                  </View>
                )}
                {/* Vibly 평점 - 항상 표시 */}
                <View style={[styles.ratingBadge, styles.viblyRatingBadge]}>
                  {place.rating > 0 ? (
                    <>
                      <Star size={12} color="#9810fa" fill="#9810fa" />
                      <View>
                        <Text style={[styles.ratingText, { fontSize: 13, color: '#9810fa' }]}>
                          {place.rating.toFixed(1)}
                        </Text>
                        <Text style={styles.ratingLabel}>vibly</Text>
                      </View>
                    </>
                  ) : (
                    <View>
                      <Text style={[styles.ratingLabel, { color: Colors.gray[400] }]}>vibly</Text>
                      <Text style={[styles.ratingEmpty, { fontSize: 11 }]}>평점 없음</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 내 방문 횟수 */}
            {(place.myCheckInCount ?? 0) > 0 && (
              <View style={styles.myVisitBadge}>
                <Text style={styles.myVisitText}>📍 내가 {place.myCheckInCount}번 방문한 곳</Text>
              </View>
            )}

            {/* 바이브 태그 */}
            {place.tags.length > 0 && (
              <View style={styles.vibeTags}>
                {place.tags.map((tag, i) => {
                  const c = VIBE_COLORS[i % VIBE_COLORS.length];
                  return (
                    <View key={tag} style={[styles.vibeTag, { backgroundColor: c.bg }]}>
                      <Text style={[styles.vibeTagText, { color: c.text }]}>{tag}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* AI 바이브 분석 카드 */}
            {emotions.length > 0 && (
              <LinearGradient
                colors={['#9810fa', '#e60076']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vibeCard}
              >
                <Text style={styles.vibeCardTitle}>✨  AI 바이브 분석</Text>
                <View style={styles.vibeScoreRow}>
                  <Text style={styles.vibeScoreBig}>{vibeScore}</Text>
                  <Text style={styles.vibeScoreUnit}>/ 100점</Text>
                </View>
                <Text style={styles.vibeMatchText}>
                  {'당신의 감정과 '}
                  <Text style={{ fontWeight: FontWeight.bold }}>{vibeScore}%</Text>
                  {' 일치해요'}
                </Text>
                <View style={styles.vibeBars}>
                  {emotions.map((e) => (
                    <EmotionBar key={e.label} label={e.label} value={e.value} />
                  ))}
                </View>
              </LinearGradient>
            )}

            {/* 추천 이유 */}
            {place.aiReasons && place.aiReasons.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>추천 이유</Text>
                {place.aiReasons.map((r) => (
                  <ReasonCard key={r.title} icon={r.icon} title={r.title} description={r.description} />
                ))}
              </View>
            )}

            {/* 방문자 통계 - Vibly 리뷰가 있을 때만 표시 */}
            {place.reviewCount > 0 && (
              <View style={styles.visitorBanner}>
                <Users size={16} color="#1c398e" />
                <Text style={styles.visitorText}>
                  <Text style={{ fontWeight: FontWeight.bold }}>{place.reviewCount}명</Text>
                  {'이 이 장소를 당신과 비슷한 감정으로 방문했어요'}
                </Text>
              </View>
            )}

            {/* 장소 정보 */}
            <View style={styles.section}>
              <InfoRow Icon={MapPin} label="주소" value={place.address} />
              {place.hours && <InfoRow Icon={Clock} label="영업시간" value={place.hours} />}
              {place.phone && <InfoRow Icon={Phone} label="전화번호" value={place.phone} />}
            </View>

            {/* 소개 */}
            {place.description && (
              <View style={styles.descCard}>
                <Text style={styles.sectionTitle}>소개</Text>
                <Text style={styles.descText}>{place.description}</Text>
              </View>
            )}

            {/* 리뷰 */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewTitleRow}>
                <MessageSquare size={16} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>리뷰</Text>
              </View>

              {/* Google 평점 요약 */}
              {(place.googleRating ?? 0) > 0 && (
                <View style={styles.googleRatingRow}>
                  <View style={styles.googleRatingLeft}>
                    <Text style={styles.googleRatingBig}>{place.googleRating!.toFixed(1)}</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1,2,3,4,5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          color="#FACC15"
                          fill={n <= Math.round(place.googleRating!) ? '#FACC15' : 'transparent'}
                        />
                      ))}
                    </View>
                    <Text style={styles.googleRatingCount}>
                      Google · {(place.googleReviewCount ?? 0).toLocaleString()}개 리뷰
                    </Text>
                  </View>
                </View>
              )}

              {/* 구분선 */}
              {(place.googleRating ?? 0) > 0 && <View style={styles.reviewDivider} />}

              {/* 바이블리 리뷰 */}
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewSubTitle}>바이블리 리뷰</Text>
                <TouchableOpacity
                  style={styles.writeReviewBtn}
                  onPress={() => setReviewModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.writeReviewBtnText}>
                    {place.myReview ? '수정하기' : '작성하기'}
                  </Text>
                </TouchableOpacity>
              </View>

              {place.reviews && place.reviews.length > 0 ? (
                <>
                  {place.reviews.map((review: PlaceReview) => (
                    <View key={review.id} style={styles.reviewItem}>
                      <View style={styles.reviewItemHeader}>
                        <Text style={styles.reviewAuthor}>{anonymizeName(review.user.name)}</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              color="#FACC15"
                              fill={n <= review.rating ? '#FACC15' : 'transparent'}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewBody} numberOfLines={3}>
                        {review.body}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                      </Text>
                    </View>
                  ))}

                  {place.reviewCount > place.reviews.length && (
                    <TouchableOpacity
                      style={styles.moreReviewsBtn}
                      onPress={() => router.push({ pathname: '/place/reviews', params: { placeId: id, placeName: place.name } })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moreReviewsText}>
                        리뷰 {place.reviewCount - place.reviews.length}개 더 보기
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.reviewEmpty}>아직 바이블리 리뷰가 없어요. 첫 리뷰를 남겨보세요!</Text>
              )}
            </View>
          </LinearGradient>
        </ScrollView>

        {/* ── 하단 버튼 ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={['transparent', 'rgba(250,245,255,0.92)', '#faf5ff', '#eff6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <TouchableOpacity style={styles.navBtn} onPress={handleNavigate} activeOpacity={0.85}>
            <Navigation size={16} color={Colors.primary[600]} />
            <Text style={styles.navBtnText}>길찾기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkinBtn} onPress={handleCheckin} activeOpacity={0.85}>
            <LinearGradient
              colors={Gradients.primary}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.checkinBtnText}>체크인</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── 리뷰 작성 모달 ──────────────────────────────────────── */}
        <ReviewModal
          visible={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={(rating, body) => reviewMutation.mutate({ rating, body })}
          isPending={reviewMutation.isPending}
          isEdit={!!place.myReview}
          initialRating={place.myReview?.rating ?? 5}
          initialBody={place.myReview?.body ?? ''}
        />
      </View>
    </ScreenTransition>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // 배경: 그라데이션 끝색(#eff6ff)으로 흰 여백 방지
  root: { flex: 1, backgroundColor: '#eff6ff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  errorText: { color: Colors.gray[500], fontSize: FontSize.base },
  heroEmoji: { fontSize: 80 },

  // 플로팅 버튼
  floatRow: {
    position: 'absolute',
    left: Spacing['2xl'],
    right: Spacing['2xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  floatBtnActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  floatRight: { flexDirection: 'row', gap: Spacing.sm },

  // 콘텐츠 시트
  contentSheet: {
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    marginTop: -32,
    padding: Spacing['2xl'],
    gap: Spacing['2xl'],
  },

  // 장소 헤더
  placeHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  placeName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#101828' },
  placeCategory: { fontSize: FontSize.base, color: '#4a5565', lineHeight: 20 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 4,
    ...Shadow.sm,
  },
  viblyRatingBadge: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  ratingText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#101828' },
  ratingLabel: { fontSize: 10, color: Colors.gray[400], marginTop: 1 },
  ratingEmpty: { fontSize: FontSize.xs, color: Colors.gray[400] },

  // Google 평점 요약
  googleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  googleRatingLeft: { alignItems: 'center', gap: 4 },
  googleRatingBig: { fontSize: 36, fontWeight: FontWeight.bold, color: '#101828', lineHeight: 40 },
  googleRatingCount: { fontSize: FontSize.xs, color: Colors.gray[500], marginTop: 2 },

  // 리뷰 구분선 및 서브타이틀
  reviewDivider: { height: 1, backgroundColor: Colors.gray[100], marginVertical: Spacing.xs },
  reviewSubTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#101828' },

  // 바이브 태그
  vibeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vibeTag: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  vibeTagText: { fontSize: FontSize.base, fontWeight: FontWeight.medium },

  // AI 바이브 분석 카드
  vibeCard: { borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], gap: Spacing.lg, ...Shadow.lg },
  vibeCardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  vibeScoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  vibeScoreBig: { fontSize: FontSize['5xl'], fontWeight: FontWeight.bold, color: Colors.white, lineHeight: 48 },
  vibeScoreUnit: { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  vibeMatchText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  vibeBars: { gap: Spacing.md },
  vibeBarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  vibeBarLabel: { width: 36, fontSize: FontSize.xs, color: Colors.white },
  vibeBarTrack: {
    flex: 1, height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  vibeBarFill: { height: '100%', backgroundColor: Colors.white, borderRadius: BorderRadius.full },
  vibeBarValue: { width: 32, fontSize: FontSize.xs, color: Colors.white, textAlign: 'right' },

  // 섹션
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#101828', marginBottom: Spacing.xs },

  // 추천 이유 카드
  reasonCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  reasonIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  reasonTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#101828', marginBottom: 2 },
  reasonDesc: { fontSize: FontSize.xs, color: '#4a5565', lineHeight: 16 },

  // 내 방문 횟수 배지
  myVisitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  myVisitText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary[700],
  },

  // 방문자 통계 배너
  visitorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#bedbff',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  visitorText: { flex: 1, fontSize: FontSize.base, color: '#1c398e', lineHeight: 20 },

  // 장소 정보
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: FontSize.xs, color: '#4a5565', marginBottom: 2 },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: '#101828' },

  // 소개
  descCard: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: BorderRadius.lg, padding: Spacing.xl },
  descText: { fontSize: FontSize.base, color: '#364153', lineHeight: 23 },

  // 리뷰 카드
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  writeReviewBtn: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  writeReviewBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  reviewItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  reviewItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthor: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#101828' },
  reviewBody: { fontSize: FontSize.base, color: '#4a5565', lineHeight: 22 },
  reviewDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  reviewEmpty: { fontSize: FontSize.sm, color: Colors.gray[400] },
  moreReviewsBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    marginTop: Spacing.xs,
  },
  moreReviewsText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary[600],
  },

  // 하단 버튼바
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 40,
    gap: Spacing.md,
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.primary[300],
    paddingVertical: Spacing.lg,
    height: 56,
  },
  navBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary[600] },
  checkinBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    height: 56,
  },
  checkinBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },

  // 리뷰 작성 모달
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    gap: Spacing.lg,
  },
  modalHandle: {
    width: 40, height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#101828' },
  modalSubtitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: '#4a5565' },
  starPicker: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  reviewInput: {
    backgroundColor: Colors.gray[50],
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: '#101828',
    minHeight: 120,
  },
  submitBtn: {
    height: 56,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
