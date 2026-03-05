import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';

const PRIVACY = [
  {
    title: '1. 수집하는 개인정보 항목',
    body: '• 필수: 이메일 주소, 이름, 닉네임\n• 선택: 프로필 사진, 선호 바이브(취향), 성별\n• 커플 연결 시: 커플 연결 코드, 파트너 닉네임/프로필\n• 게시판 이용 시: 작성한 게시글/댓글/리뷰 콘텐츠\n• 자동수집: 기기 정보(OS·앱 버전), 위치정보(동의 후), 서비스 이용 기록, 기분/체크인 이력, AI 추천 요청 내용',
  },
  {
    title: '2. 개인정보 수집 및 이용 목적',
    body: '• 회원 식별 및 서비스 제공\n• AI 기반 개인화 장소 추천 및 바이브 분석\n• 커플 연결 서비스 제공\n• 커뮤니티 게시판 운영\n• 프리미엄 구독 관리 및 크레딧 정산\n• 맞춤형 알림 발송\n• 부정 이용 방지\n• 고객 지원 및 분쟁 해결\n• 서비스 개선 및 신규 기능 개발',
  },
  {
    title: '3. 개인정보 보유 및 이용 기간',
    body: '회원 탈퇴 시까지 보유합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우:\n• 전자상거래 거래기록: 5년 (전자상거래법)\n• 소비자 불만 처리: 3년 (전자상거래법)\n• 서비스 부정이용 방지: 탈퇴 후 30일\n• 체크인 이력: 탈퇴 시 즉시 삭제',
  },
  {
    title: '4. 개인정보 제3자 제공',
    body: '회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 수사기관 요청, 서비스 제공을 위한 필수 협력사에의 업무 위탁은 예외로 합니다.\n커플 연결 기능 이용 시 파트너의 닉네임과 프로필 사진이 상대방에게 공유됩니다.',
  },
  {
    title: '5. 개인정보 처리 위탁',
    body: '• Cloudflare (R2): 이미지·파일 스토리지 운영\n• Neon Technologies: 데이터베이스 운영\n• Render: 서버 인프라 운영\n• 위탁 업체는 개인정보 처리 목적 이외의 용도로 사용하지 않습니다.',
  },
  {
    title: '6. 정보주체의 권리',
    body: '이용자는 언제든지 다음 권리를 행사할 수 있습니다:\n• 개인정보 열람 요청\n• 정정·삭제 요청\n• 처리 정지 요청\n• 개인정보 이동 요청\n행사 방법: 앱 내 설정 > 계정 삭제 또는 support@vibly.app으로 문의',
  },
  {
    title: '7. 위치정보 처리',
    body: '위치정보는 주변 장소 탐색, AI 근심 바이브 탐색 기능에 한해 사용됩니다. 이용자가 위치 권한을 거부한 경우에도 기본 서비스 이용이 가능하며, 위치 기반 기능만 제한됩니다.',
  },
  {
    title: '8. AI 추천 기능 및 기분/바이브 데이터',
    body: '이용자의 기분, 체크인 이력, 선호 취향 데이터는 AI 추천 알고리즘 개선에만 사용됩니다. 해당 데이터는 제3자에게 판매되지 않으며, 어떠한 광고 목적으로도 사용되지 않습니다.',
  },
  {
    title: '9. 개인정보 보호책임자',
    body: '성명: Vibly 개인정보보호팀\n이메일: privacy@vibly.app\n개인정보 처리에 관한 불만, 피해 구제 등의 문의는 위 연락처로 문의해 주세요.',
  },
  {
    title: '10. 개인정보 처리방침 변경',
    body: '이 개인정보 처리방침은 법령·정책 또는 보안 기술 변경에 따라 내용이 추가·삭제·수정될 수 있습니다. 중요한 변경사항은 앱 내 공지사항으로 7일 이상 사전 공지합니다.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>개인정보 처리방침</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Vibly 개인정보 처리방침</Text>
            <Text style={styles.introDate}>시행일: 2026년 3월 1일 (최종 개정)</Text>
            <Text style={styles.introDesc}>
              Vibly는 이용자의 개인정보를 소중히 여깁니다. 본 처리방침은 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 따라 작성되었습니다.
            </Text>
          </View>

          {PRIVACY.map((item, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionBody}>{item.body}</Text>
            </View>
          ))}

          <Text style={styles.footer}>문의: privacy@vibly.app</Text>
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
  introDate: { fontSize: FontSize.sm, color: Colors.gray[500], marginBottom: Spacing.sm },
  introDesc: { fontSize: FontSize.sm, color: Colors.gray[600], lineHeight: 20 },
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
