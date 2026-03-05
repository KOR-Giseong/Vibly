import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';

const TERMS = [
  {
    title: '제1조 (목적)',
    body: '이 약관은 Vibly(이하 "회사")가 제공하는 Vibly 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    body: '"서비스"란 회사가 제공하는 감성 기반 장소 탐색, AI 장소 추천, 체크인, 바이브 리포트, 커뮤니티 게시판, 커플 연결, 프리미엄 구독 등 모바일 앱 기반의 모든 서비스를 말합니다.
"이용자"란 이 약관에 따라 서비스를 이용하는 자를 말합니다.
"콘텐츠"란 이용자가 서비스 내에 게시한 텍스트, 이미지, 리뷰, 게시글, 댓글 등 모든 정보를 말합니다.
"크레딧"이란 AI 추천 기능 이용에 필요한 앱 내 포인트를 말합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body: '이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 시행 7일 전 사전 통지합니다.',
  },
  {
    title: '제4조 (서비스 이용)',
    body: '서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단, 회사의 업무상 또는 기술상의 이유로 일정 기간 서비스가 제한될 수 있으며, 이 경우 사전 공지합니다.
AI 추천 기능은 크레딧을 소진하여 이용하며, 특정 기능은 프리미엄 구독 활성화 시 이용 가능합니다.',
  },
  {
    title: '제5조 (AI 추천 및 크레딧)',
    body: 'AI 장소 추천은 이용자의 기분, 취향, 체크인 이력을 기반으로 개인화되어 제공됩니다. AI의 추천 결과는 참고용이며, 회사는 추천의 정확성이나 만족도를 보장하지 않습니다.
크레딧은 유효기일로부터 1년이며, 미사용된 크레딧은 환불되지 않습니다. 프리미엄 구독 해지 시에도 기존 보유 크레딧은 유효기간까지 사용 가능합니다.',
  },
  {
    title: '제6조 (커플 연결 서비스)',
    body: '커플 연결 기능은 두 이용자의 상호 코드 입력을 통해 활성화됩니다. 커플 연결 시 상대방의 닉네임, 프로필 사진 및 스크랩 장소 일부가 공유될 수 있습니다.
커플 연결을 해제하면 상대방의 정보에 대한 접근이 즉시 중단되며, 코드 재생성 후 새로운 커플을 연결할 수 있습니다.',
  },
  {
    title: '제7조 (커뮤니티 이용)',
    body: '커뮤니티 게시판에 작성된 콘텐츠는 다른 이용자에게 공개됩니다. 이용자는 사실에 근거한 정보를 게시할 의무가 있으며, 다음 행위는 금지됩니다:
• 허위 정보 또는 타인 명예 훼손 콘텐츠 게시
• 비속어, 성적 표현, 혐오 표현 게시
• 광고·홍보 목적의 콘텐츠 게시

부적절한 콘텐츠는 통보 없이 제한 또는 삭제될 수 있습니다.',
  },
  {
    title: '제8조 (이용자의 의무)',
    body: '이용자는 다음 행위를 해서는 안 됩니다:
• 다른 이용자의 계정 정보 도용
• 회사 및 제3자의 지식재산권 침해
• 서비스 정상 운영 방해 (DDoS, 스팸 등)
• AI 추천 결과를 이용한 허위 리뷰 등 가짜 콘텐츠 생성
• 서비스를 통한 체계적 데이터 수집 및 크롤링',
  },
  {
    title: '제9조 (콘텐츠 저작권)',
    body: '이용자가 게시한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다. 다만, 이용자는 회사가 서비스 운영 및 홍보 목적으로 콘텐츠를 사용할 수 있도록 비독점적 라이선스를 부여합니다.',
  },
  {
    title: '제10조 (서비스 해지)',
    body: '이용자는 언제든지 앱 내 설정 > 계정 삭제를 통해 서비스 이용 계약을 해지할 수 있습니다. 탈퇴 시 이용자의 권보, 크레딧, 커플 연결 정보는 즉시 삭제되며, 개인정보는 관련 법령에 따라 처리됩니다.
프리미엄 구독 중인 경우 구독 주기 만료 전 해지 요청을 원칙으로 합니다.',
  },
  {
    title: '제11조 (면책조항)',
    body: '회사는 천재지변, 불가항력적 사유, 이용자 귀책 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다. AI 추천의 부정확성으로 인한 장소 방문 결과에 대해서도 책임하지 않습니다. 이용자 간 거래 또는 분쟁에 대해서도 회사는 개입하지 않습니다.',
  },
  {
    title: '제12조 (준거법 및 관할법원)',
    body: '이 약관의 해석 및 분쟁 해결은 대한민국 법률을 준거법으로 합니다. 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우, 서울중앙지방법원을 관할 법원으로 합니다.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>서비스 약관</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Vibly 서비스 이용약관</Text>
            <Text style={styles.introDate}>시행일: 2026년 3월 1일 (최종 개정)</Text>
          </View>

          {TERMS.map((item, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionBody}>{item.body}</Text>
            </View>
          ))}

          <Text style={styles.footer}>문의: support@vibly.app</Text>
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
  introCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'], marginBottom: Spacing.xl, ...Shadow.sm,
    borderLeftWidth: 4, borderLeftColor: Colors.primary[500],
  },
  introTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: 4 },
  introDate: { fontSize: FontSize.sm, color: Colors.gray[500] },
  section: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md, fontWeight: FontWeight.semibold,
    color: Colors.primary[700], marginBottom: Spacing.sm,
  },
  sectionBody: { fontSize: FontSize.sm, color: Colors.gray[600], lineHeight: 22 },
  footer: {
    textAlign: 'center', fontSize: FontSize.xs,
    color: Colors.gray[400], marginTop: Spacing.xl,
  },
});
