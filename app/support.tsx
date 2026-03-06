import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, MessageCircle, ChevronRight, Inbox, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { supportService } from '@services/support.service';
import type { SupportTicket, TicketStatus } from '@/types';

const FAQ_CATEGORIES = [
  {
    category: '앱 사용법',
    questions: ['체크인은 어떻게 하나요?', '바이브 리포트는 어떻게 확인하나요?', '장소 검색이 안 돼요', '북마크 기능은 어디에 있나요?'],
  },
  {
    category: '계정',
    questions: ['비밀번호를 잊어버렸어요', '닉네임을 변경하고 싶어요', '계정 탈퇴는 어떻게 하나요?', '소셜 로그인 연동을 해제하고 싶어요'],
  },
  {
    category: '결제/구독',
    questions: ['구독 취소는 어떻게 하나요?', '결제가 중복으로 됐어요', '구독 혜택이 적용 안 돼요', '환불 요청하고 싶어요'],
  },
  {
    category: '오류/버그',
    questions: ['앱이 자꾸 꺼져요', '지도가 표시되지 않아요', '알림이 오지 않아요', '사진 업로드가 안 돼요'],
  },
];

type Mode = 'landing' | 'faq-category' | 'faq-questions' | 'my-tickets' | 'ticket-detail';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: '검토 중',
  IN_PROGRESS: '처리 중',
  RESOLVED: '답변 완료',
  CLOSED: '종료',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  RESOLVED: '#10B981',
  CLOSED: Colors.gray[400],
};

export default function SupportScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('landing');
  const [selectedCategory, setSelectedCategory] = useState<null | typeof FAQ_CATEGORIES[0]>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const all = await supportService.getMyTickets();
      setTickets(all.filter((t: SupportTicket) => t.type === 'FAQ'));
    } catch {
      // 에러 무시
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleFaqQuestion = async (question: string) => {
    setSubmitting(true);
    try {
      await supportService.submitTicket(question, `FAQ 질문: ${question}`, 'FAQ');
      Alert.alert(
        '문의 접수 완료 ✅',
        '담당자 검토 후 알림으로 답변 드릴게요.\n\n문의 내용은 90일간 안전하게 보관됩니다.',
        [{ text: '확인', onPress: () => { setMode('landing'); loadTickets(); } }],
      );
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '접수에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMyTickets = () => (
    <>
      <Text style={styles.sectionHeader}>내 문의 목록</Text>
      {loadingTickets ? (
        <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginTop: Spacing.xl }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyTickets}>
          <Inbox size={40} color={Colors.gray[300]} />
          <Text style={styles.emptyTicketsText}>아직 접수된 문의가 없어요</Text>
        </View>
      ) : (
        tickets.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={styles.ticketCard}
            onPress={() => { setSelectedTicket(ticket); setMode('ticket-detail'); }}
            activeOpacity={0.8}
          >
            <View style={styles.ticketCardTop}>
              <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
                  {STATUS_LABELS[ticket.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketDate}>
              {new Date(ticket.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
            {ticket.adminReply && (
              <Text style={styles.ticketReplyPreview} numberOfLines={1}>💬 {ticket.adminReply}</Text>
            )}
          </TouchableOpacity>
        ))
      )}
      <Text style={styles.retentionNote}>💾 문의 내용은 접수일로부터 90일간 보관됩니다</Text>
    </>
  );

  const renderTicketDetail = () => {
    if (!selectedTicket) return null;
    const resolved = selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED';
    return (
      <View style={styles.detailWrap}>
        {/* 상태 뱃지 */}
        <View style={[styles.detailStatusRow, { backgroundColor: STATUS_COLORS[selectedTicket.status] + '18' }]}>
          {resolved
            ? <CheckCircle2 size={16} color={STATUS_COLORS[selectedTicket.status]} />
            : <Clock size={16} color={STATUS_COLORS[selectedTicket.status]} />}
          <Text style={[styles.detailStatusText, { color: STATUS_COLORS[selectedTicket.status] }]}>
            {STATUS_LABELS[selectedTicket.status]}
          </Text>
        </View>

        {/* 내 질문 */}
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>📝 내 질문</Text>
          <Text style={styles.detailQuestion}>{selectedTicket.title}</Text>
          <Text style={styles.detailDate}>
            {new Date(selectedTicket.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* 관리자 답변 */}
        {selectedTicket.adminReply ? (
          <View style={[styles.detailCard, styles.replyCard]}>
            <Text style={styles.detailLabel}>💬 Vibly 팀 답변</Text>
            <Text style={styles.replyText}>{selectedTicket.adminReply}</Text>
            {selectedTicket.repliedAt && (
              <Text style={styles.detailDate}>
                {new Date(selectedTicket.repliedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.detailCard, styles.pendingCard]}>
            <AlertCircle size={18} color={Colors.gray[400]} style={{ marginBottom: 6 }} />
            <Text style={styles.pendingText}>검토 중이에요. 답변이 오면 알림으로 알려드릴게요! 🙏</Text>
          </View>
        )}

        <Text style={styles.retentionNote}>💾 문의 내용은 접수일로부터 90일간 안전하게 보관됩니다</Text>
      </View>
    );
  };

  const renderLanding = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <HelpCircle size={32} color={Colors.primary[600]} />
        </View>
        <Text style={styles.heroTitle}>어떻게 도와드릴까요?</Text>
        <Text style={styles.heroSub}>질문 유형을 선택해 주세요</Text>
      </View>

      {/* FAQ 카드 */}
      <TouchableOpacity style={styles.modeCard} onPress={() => setMode('faq-category')} activeOpacity={0.85}>
        <LinearGradient colors={['#7C3AED15', '#9810FA10']} style={styles.modeCardGradient}>
          <View style={[styles.modeIcon, { backgroundColor: Colors.primary[100] }]}>
            <HelpCircle size={26} color={Colors.primary[600]} />
          </View>
          <View style={styles.modeText}>
            <Text style={styles.modeTitle}>자주 묻는 질문</Text>
            <Text style={styles.modeSub}>빠른 답변이 필요하다면</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray[400]} />
        </LinearGradient>
      </TouchableOpacity>

      {/* 1:1 채팅 카드 */}
      <TouchableOpacity
        style={styles.modeCard}
        onPress={() => router.push('/support-chat')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#DB277710', '#E6007610']} style={styles.modeCardGradient}>
          <View style={[styles.modeIcon, { backgroundColor: '#DB27771A' }]}>
            <MessageCircle size={26} color="#DB2777" />
          </View>
          <View style={styles.modeText}>
            <Text style={styles.modeTitle}>1:1 채팅 문의</Text>
            <Text style={styles.modeSub}>직접 상담하고 싶다면</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray[400]} />
        </LinearGradient>
      </TouchableOpacity>

      {/* 내 문의 */}
      {(loadingTickets || tickets.length > 0) && (
        <>
          <View style={styles.myTicketsHeader}>
            <Text style={styles.myTicketsTitle}>내 문의 {tickets.length > 0 ? `(${tickets.length}건)` : ''}</Text>
            {tickets.length > 0 && (
              <TouchableOpacity onPress={() => setMode('my-tickets')}>
                <Text style={styles.myTicketsMore}>전체 보기</Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingTickets ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            tickets.slice(0, 2).map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => { setSelectedTicket(ticket); setMode('ticket-detail'); }}
                activeOpacity={0.8}
              >
                <View style={styles.ticketCardTop}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
                      {STATUS_LABELS[ticket.status]}
                    </Text>
                  </View>
                </View>
                {ticket.adminReply
                  ? <Text style={styles.ticketReplyPreview} numberOfLines={1}>💬 {ticket.adminReply}</Text>
                  : <Text style={styles.ticketPending}>검토 중...</Text>}
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </>
  );

  const renderCategories = () => (
    <>
      <Text style={styles.sectionHeader}>카테고리를 선택해 주세요</Text>
      {FAQ_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.category}
          style={styles.categoryCard}
          onPress={() => { setSelectedCategory(cat); setMode('faq-questions'); }}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryTitle}>{cat.category}</Text>
          <Text style={styles.categoryCount}>질문 {cat.questions.length}개</Text>
          <ChevronRight size={18} color={Colors.gray[400]} />
        </TouchableOpacity>
      ))}
    </>
  );

  const renderQuestions = () => (
    <>
      <Text style={styles.sectionHeader}>{selectedCategory?.category}</Text>
      {selectedCategory?.questions.map((q) => (
        <TouchableOpacity
          key={q}
          style={styles.questionCard}
          onPress={() => handleFaqQuestion(q)}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Text style={styles.questionText}>{q}</Text>
          {submitting
            ? <ActivityIndicator size="small" color={Colors.primary[500]} />
            : <ChevronRight size={18} color={Colors.gray[400]} />
          }
        </TouchableOpacity>
      ))}
    </>
  );

  const handleBack = () => {
    if (mode === 'ticket-detail') { setMode('my-tickets'); return; }
    if (mode === 'my-tickets') { setMode('landing'); return; }
    if (mode === 'faq-questions') { setMode('faq-category'); return; }
    if (mode === 'faq-category') { setMode('landing'); return; }
    router.back();
  };

  const headerTitle = {
    landing: '고객센터',
    'faq-category': '자주 묻는 질문',
    'faq-questions': selectedCategory?.category ?? '질문 선택',
    'my-tickets': '내 문의',
    'ticket-detail': '문의 상세',
  }[mode];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {mode === 'landing' && renderLanding()}
          {mode === 'faq-category' && renderCategories()}
          {mode === 'faq-questions' && renderQuestions()}
          {mode === 'my-tickets' && renderMyTickets()}
          {mode === 'ticket-detail' && renderTicketDetail()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  backButton: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['4xl'] },

  heroCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.xl, ...Shadow.sm,
  },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: 6 },
  heroSub: { fontSize: FontSize.sm, color: Colors.gray[500] },

  modeCard: { borderRadius: BorderRadius['2xl'], marginBottom: Spacing.md, overflow: 'hidden', ...Shadow.sm },
  modeCardGradient: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    padding: Spacing.xl, backgroundColor: Colors.white,
  },
  modeIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  modeText: { flex: 1 },
  modeTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: 2 },
  modeSub: { fontSize: FontSize.sm, color: Colors.gray[500] },

  sectionHeader: {
    fontSize: FontSize.md, fontWeight: FontWeight.semibold,
    color: Colors.gray[700], marginBottom: Spacing.lg,
  },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm,
  },
  categoryTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.gray[900] },
  categoryCount: { fontSize: FontSize.sm, color: Colors.gray[400], marginRight: Spacing.sm },

  questionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm,
  },
  questionText: { flex: 1, fontSize: FontSize.md, color: Colors.gray[800], lineHeight: 22 },

  // 내 문의 랜딩
  myTicketsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  myTicketsTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[700] },
  myTicketsMore: { fontSize: FontSize.sm, color: Colors.primary[600], fontWeight: FontWeight.medium },

  // 티켓 카드
  ticketCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm,
  },
  ticketCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  ticketTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[900] },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: FontWeight.semibold },
  ticketDate: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  ticketReplyPreview: { fontSize: FontSize.xs, color: Colors.primary[600], marginTop: 4 },
  ticketPending: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 4 },

  // 빈 티켓
  emptyTickets: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  emptyTicketsText: { fontSize: FontSize.sm, color: Colors.gray[400] },

  // 보관 안내
  retentionNote: {
    fontSize: 11, color: Colors.gray[400], textAlign: 'center',
    marginTop: Spacing.xl, lineHeight: 16,
  },

  // 상세 보기
  detailWrap: { gap: Spacing.md },
  detailStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: 6, marginBottom: Spacing.sm,
  },
  detailStatusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  detailCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadow.sm,
  },
  detailLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gray[500], marginBottom: 8 },
  detailQuestion: { fontSize: FontSize.md, color: Colors.gray[900], lineHeight: 22 },
  detailDate: { fontSize: 11, color: Colors.gray[400], marginTop: 6 },
  replyCard: { backgroundColor: Colors.primary[50] },
  replyText: { fontSize: FontSize.md, color: Colors.gray[800], lineHeight: 22 },
  pendingCard: { alignItems: 'center', paddingVertical: Spacing.xl, backgroundColor: Colors.gray[50] },
  pendingText: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
