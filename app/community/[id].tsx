import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, MessageCircle, Eye, MoreVertical, Send, Trash2, Flag, User, Plus, X,
} from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow,
} from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { communityApi } from '@services/community.service';
import { POST_CATEGORY_LABEL, REPORT_REASON_LABEL } from '@/types';
import type { ReportReason } from '@/types';
import { useAuthStore } from '@stores/auth.store';
import { formatRelativeTime } from '@utils/format';
import { containsProfanity } from '@utils/profanity';
import * as ImagePicker from 'expo-image-picker';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [showActions, setShowActions] = useState(false);
  // reportTarget: null = 비표시, type='post'이면 게시글 신고, type='comment'이면 댓글 신고
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment'; id: string;
  } | null>(null);
  const [reportStep, setReportStep] = useState<1 | 2>(1);
  const [reportReason, setReportReason] = useState<ReportReason>('SPAM');
  const [reportDetail, setReportDetail] = useState('');
  const [reportImages, setReportImages] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const closeReport = () => {
    setReportTarget(null);
    setReportStep(1);
    setReportDetail('');
    setReportImages([]);
  };

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => communityApi.getPostById(id!),
    enabled: !!id,
  });

  const likeMut = useMutation({
    mutationFn: () => communityApi.toggleLike(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  });

  const commentMut = useMutation({
    mutationFn: (body: string) => communityApi.addComment(id!, body),
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['post', id] });
    },
  });

  const deletePostMut = useMutation({
    mutationFn: () => communityApi.deletePost(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => communityApi.deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  });

  const reportMut = useMutation({
    mutationFn: ({ reason, detail, imageUrls }: { reason: ReportReason; detail?: string; imageUrls?: string[] }) => {
      // 댓글 신고는 detail에 comment:{id} 프리픽스 포함
      const finalDetail = [
        reportTarget?.type === 'comment' ? `comment:${reportTarget.id}` : null,
        detail?.trim() || null,
      ].filter(Boolean).join(' | ') || undefined;
      return communityApi.reportPost(id!, reason, finalDetail, imageUrls);
    },
    onSuccess: (data) => {
      closeReport();
      Alert.alert('신고 접수', data.message);
    },
    onError: (err: any) => {
      closeReport();
      Alert.alert('신고 실패', err?.response?.data?.message ?? '신고 중 오류가 발생했어요.');
    },
  });

  const pickReportImage = async () => {
    if (reportImages.length >= 3) {
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
      setReportImages((prev) => [...prev, `data:${mimeType};base64,${asset.base64}`]);
    }
  };

  const handleDeletePost = () => {
    setShowActions(false);
    Alert.alert('게시글 삭제', '이 게시글을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deletePostMut.mutate() },
    ]);
  };

  const handleOpenReport = () => {
    setShowActions(false);
    setReportStep(1);
    setReportTarget({ type: 'post', id: id! });
  };

  const handleReportComment = (commentId: string) => {
    setReportStep(1);
    setReportTarget({ type: 'comment', id: commentId });
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteCommentMut.mutate(commentId) },
    ]);
  };

  const REPORT_REASONS: ReportReason[] = ['SPAM', 'ABUSE', 'ILLEGAL', 'ADULT', 'PRIVACY', 'OTHER'];

  const isOwner = user?.id === post?.user?.id;
  const isAdmin = user?.isAdmin === true;
  const canModify = isOwner || isAdmin;

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator color={Colors.primary[600]} size="large" />
        </View>
      </LinearGradient>
    );
  }

  if (!post) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
          <Text style={styles.errorText}>게시글을 불러올 수 없습니다.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* 헤더 */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { zIndex: 1 }]}>
              <ArrowLeft size={22} color={Colors.gray[700]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{POST_CATEGORY_LABEL[post.category]}</Text>
            {user ? (
              <TouchableOpacity onPress={() => setShowActions(!showActions)} style={[styles.actionBtn, { zIndex: 1 }]}>
                <MoreVertical size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            ) : (
              <View style={styles.actionBtn} />
            )}
          </View>

          {/* 액션 메뉴 */}
          {showActions && user && (
            <View style={styles.actionMenu}>
              {canModify && (
                <TouchableOpacity style={styles.actionMenuItem} onPress={handleDeletePost}>
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={styles.actionMenuItemTextDanger}>게시글 삭제</Text>
                </TouchableOpacity>
              )}
              {!isOwner && (
                <TouchableOpacity style={styles.actionMenuItem} onPress={handleOpenReport}>
                  <Flag size={16} color={Colors.gray[600]} />
                  <Text style={styles.actionMenuItemText}>신고하기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* 게시글 본문 */}
            <View style={styles.postContainer}>
              {/* 카테고리 + 날짜 */}
              <View style={styles.metaRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{POST_CATEGORY_LABEL[post.category]}</Text>
                </View>
                <Text style={styles.metaDate}>{formatRelativeTime(post.createdAt)}</Text>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>

              {/* 작성자 */}
              <View style={styles.authorRow}>
                {post.user.avatarUrl ? (
                  <Image source={{ uri: post.user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={16} color={Colors.gray[400]} strokeWidth={1.5} />
                  </View>
                )}
                <Text style={styles.authorName}>{post.user.nickname ?? post.user.name}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.postBody}>{post.body}</Text>
            </View>

            {/* 통계 + 좋아요 */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Eye size={14} color={Colors.gray[400]} />
                <Text style={styles.statText}>{post.viewCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MessageCircle size={14} color={Colors.gray[400]} />
                <Text style={styles.statText}>{post.commentCount}</Text>
              </View>
              <TouchableOpacity
                style={styles.likeBtn}
                onPress={() => likeMut.mutate()}
                activeOpacity={0.7}
              >
                <Heart
                  size={18}
                  color={post.isLiked ? '#e60076' : Colors.gray[400]}
                  fill={post.isLiked ? '#e60076' : 'none'}
                />
                <Text style={[styles.statText, post.isLiked && styles.likedText]}>
                  {post.likeCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 댓글 목록 */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>댓글 {post.commentCount}개</Text>

              {(post.comments ?? []).map((comment) => {
                const canDeleteComment = user?.id === comment.user.id || isAdmin;
                return (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentMeta}>
                        {comment.user.avatarUrl ? (
                          <Image source={{ uri: comment.user.avatarUrl }} style={styles.commentAvatar} />
                        ) : (
                          <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                            <User size={13} color={Colors.gray[400]} strokeWidth={1.5} />
                          </View>
                        )}
                        <View>
                          <Text style={styles.commentAuthor}>
                            {comment.user.nickname ?? comment.user.name}
                          </Text>
                          <Text style={styles.commentDate}>{formatRelativeTime(comment.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.commentActions}>
                        {user && user.id !== comment.user.id && (
                          <TouchableOpacity
                            onPress={() => handleReportComment(comment.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Flag size={13} color={Colors.gray[300]} />
                          </TouchableOpacity>
                        )}
                        {canDeleteComment && (
                          <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                            <Trash2 size={14} color={Colors.gray[400]} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={styles.commentBody}>{comment.body}</Text>
                  </View>
                );
              })}

              {(post.comments ?? []).length === 0 && (
                <Text style={styles.noComments}>첫 번째 댓글을 남겨보세요!</Text>
              )}
            </View>
          </ScrollView>

          {/* 댓글 입력창 */}
          {user && (
            <View style={[styles.commentInputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor={Colors.gray[400]}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!commentText.trim() || commentMut.isPending) && styles.sendBtnDisabled,
                ]}
                onPress={() => {
                  if (!commentText.trim()) return;
                  if (containsProfanity(commentText.trim())) {
                    Alert.alert('작성 불가', '부적절한 언어는 사용하실 수 없습니다.');
                    return;
                  }
                  commentMut.mutate(commentText.trim());
                }}
                disabled={!commentText.trim() || commentMut.isPending}
              >
                {commentMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* 신고 모달 */}
      <Modal
        visible={reportTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={closeReport}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.reportOverlay} onPress={closeReport}>
            <Pressable style={styles.reportSheet} onPress={() => {}}>
              <View style={styles.reportHandle} />

              {reportStep === 1 ? (
                // ── STEP 1: 신고 사유 선택 ────────────────────
                <>
                  <Text style={styles.reportTitle}>
                    {reportTarget?.type === 'comment' ? '댓글' : '게시글'} 신고 사유를 선택해주세요
                  </Text>
                  {(['SPAM', 'ABUSE', 'ILLEGAL', 'ADULT', 'PRIVACY', 'OTHER'] as ReportReason[]).map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={styles.reportOption}
                      onPress={() => { setReportReason(reason); setReportStep(2); }}
                    >
                      <Text style={styles.reportOptionText}>{REPORT_REASON_LABEL[reason]}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.reportCancel} onPress={closeReport}>
                    <Text style={styles.reportCancelText}>취소</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // ── STEP 2: 상세 내용 + 사진 첨부 ────────────────
                <>
                  <Text style={styles.reportTitle}>신고 상세 작성</Text>

                  {/* 선택된 사유 칩 */}
                  <View style={styles.reportReasonChip}>
                    <Text style={styles.reportReasonChipText}>{REPORT_REASON_LABEL[reportReason]}</Text>
                    <TouchableOpacity onPress={() => setReportStep(1)}>
                      <Text style={styles.reportReasonChipChange}>변경</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 구체적 내용 */}
                  <TextInput
                    style={styles.reportDetailInput}
                    placeholder="구체적인 내용을 작성해주세요 (선택)"
                    placeholderTextColor={Colors.gray[300]}
                    value={reportDetail}
                    onChangeText={setReportDetail}
                    multiline
                    maxLength={500}
                    numberOfLines={4}
                  />

                  {/* 사진 첨부 */}
                  <Text style={styles.reportImgLabel}>사진 첨부 (선택, 최대 3장)</Text>
                  <View style={styles.reportImgRow}>
                    {reportImages.map((uri, i) => (
                      <View key={i} style={styles.reportImgThumbWrap}>
                        <Image source={{ uri }} style={styles.reportImgThumb} />
                        <TouchableOpacity
                          style={styles.reportImgRemove}
                          onPress={() => setReportImages((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X size={12} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {reportImages.length < 3 && (
                      <TouchableOpacity style={styles.reportImgAdd} onPress={pickReportImage}>
                        <Plus size={20} color={Colors.gray[400]} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 제출 */}
                  <TouchableOpacity
                    style={[styles.reportSubmitBtn, reportMut.isPending && { opacity: 0.5 }]}
                    onPress={() => reportMut.mutate({ reason: reportReason, detail: reportDetail, imageUrls: reportImages })}
                    disabled={reportMut.isPending}
                  >
                    {reportMut.isPending
                      ? <ActivityIndicator color={Colors.white} />
                      : <Text style={styles.reportSubmitText}>신고 접수</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reportCancel} onPress={closeReport}>
                    <Text style={styles.reportCancelText}>취소</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenTransition>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.base, color: Colors.gray[500] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    position: 'relative',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.full, backgroundColor: Colors.white, ...Shadow.sm,
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900],
  },
  actionBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.full, backgroundColor: Colors.white, ...Shadow.sm,
  },
  actionMenu: {
    position: 'absolute', right: Spacing.lg, top: 90, backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, ...Shadow.md, zIndex: 100, overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  actionMenuItemText: { fontSize: FontSize.sm, color: Colors.gray[700], fontWeight: FontWeight.medium },
  actionMenuItemTextDanger: { fontSize: FontSize.sm, color: '#EF4444', fontWeight: FontWeight.medium },

  // 게시글 본문
  postContainer: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  categoryChip: {
    backgroundColor: Colors.primary[600] + '15', borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.primary[600] },
  metaDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  postTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900],
    marginBottom: Spacing.md, lineHeight: 28,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray[200] },
  avatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[700] },
  divider: { height: 1, backgroundColor: Colors.gray[100], marginBottom: Spacing.md },
  postBody: { fontSize: FontSize.base, color: Colors.gray[800], lineHeight: 24 },

  // 통계 바
  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadow.sm,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.sm, color: Colors.gray[500] },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  likedText: { color: '#e60076' },

  // 댓글
  commentsSection: { marginHorizontal: Spacing.lg },
  commentsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900], marginBottom: Spacing.sm },
  commentCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray[200] },
  commentAvatarPlaceholder: { backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[800] },
  commentDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  commentBody: { fontSize: FontSize.sm, color: Colors.gray[700], lineHeight: 20 },
  noComments: { fontSize: FontSize.sm, color: Colors.gray[400], textAlign: 'center', paddingVertical: Spacing.lg },

  // 댓글 입력
  commentInputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100],
  },
  commentInput: {
    flex: 1, backgroundColor: Colors.gray[50], borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.gray[900], maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.gray[300] },

  // 신고 모달
  reportOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  reportSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: 32,
  },
  reportHandle: {
    width: 36, height: 4, backgroundColor: Colors.gray[200],
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  reportTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900],
    textAlign: 'center', marginBottom: Spacing.md,
  },
  reportOption: {
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  reportOptionText: { fontSize: FontSize.base, color: Colors.gray[800] },
  reportCancel: {
    marginTop: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', borderRadius: BorderRadius.lg, backgroundColor: Colors.gray[100],
  },
  reportCancelText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.gray[600] },
  reportReasonChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
  },
  reportReasonChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary[700] },
  reportReasonChipChange: { fontSize: FontSize.xs, color: Colors.primary[500], textDecorationLine: 'underline' },
  reportDetailInput: {
    borderWidth: 1, borderColor: Colors.gray[200], borderRadius: BorderRadius.lg,
    padding: Spacing.md, fontSize: FontSize.sm, color: Colors.gray[900],
    minHeight: 90, textAlignVertical: 'top', marginBottom: Spacing.sm,
  },
  reportImgLabel: { fontSize: FontSize.xs, color: Colors.gray[500], marginBottom: Spacing.xs },
  reportImgRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  reportImgThumbWrap: { position: 'relative' },
  reportImgThumb: { width: 70, height: 70, borderRadius: BorderRadius.lg },
  reportImgRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  reportImgAdd: {
    width: 70, height: 70, borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.gray[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray[50],
  },
  reportSubmitBtn: {
    backgroundColor: '#EF4444', borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm,
  },
  reportSubmitText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
