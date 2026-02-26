import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, MessageCircle, ChevronRight } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { supportService } from '@services/support.service';

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

type Mode = 'landing' | 'faq-category' | 'faq-questions';

export default function SupportScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('landing');
  const [selectedCategory, setSelectedCategory] = useState<null | typeof FAQ_CATEGORIES[0]>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFaqQuestion = async (question: string) => {
    setSubmitting(true);
    try {
      await supportService.submitTicket(question, `FAQ 질문: ${question}`, 'FAQ');
      Alert.alert('문의 접수 완료', '빠른 시일 내에 답변 드릴게요! 🙏\n답변은 알림으로 알려드려요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '접수에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
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
    if (mode === 'faq-questions') { setMode('faq-category'); return; }
    if (mode === 'faq-category') { setMode('landing'); return; }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>고객센터</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {mode === 'landing' && renderLanding()}
          {mode === 'faq-category' && renderCategories()}
          {mode === 'faq-questions' && renderQuestions()}
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
});
