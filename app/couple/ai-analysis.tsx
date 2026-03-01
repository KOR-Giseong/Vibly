import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Sparkles, MapPin } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients,
} from '@constants/theme';
import { coupleService, type AiDateAnalysisResult, type AiDateAnalysisRecommendation } from '@services/couple.service';

export default function AiAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<AiDateAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    coupleService.aiDateAnalysis()
      .then(setResult)
      .catch((e: any) => setError(e?.response?.data?.message ?? 'AI 분석에 실패했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 데이트 분석</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#9810FA" size="large" />
            <Text style={styles.loadingText}>AI가 최적의 데이트 코스를{'\n'}분석 중입니다...</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>😥</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      ) : result ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 크레딧 */}
          <View style={styles.creditBadge}>
            <Sparkles size={13} color="#9810FA" />
            <Text style={styles.creditText}>남은 크레딧: {result.creditsRemaining}</Text>
          </View>

          {/* 분석 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={styles.cardIconWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={18} color={Colors.white} />
              </LinearGradient>
              <Text style={styles.cardTitle}>AI 분석 결과</Text>
            </View>
            <Text style={styles.analysisText}>{result.analysis}</Text>
          </View>

          {/* 추천 코스 */}
          {(result.recommendations?.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionLabel}>추천 데이트 코스</Text>
              {(result.recommendations ?? []).map((rec: AiDateAnalysisRecommendation, idx: number) => (
                <View key={idx} style={styles.recommendCard}>
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    style={styles.recommendNum}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.recommendNumText}>{idx + 1}</Text>
                  </LinearGradient>
                  <View style={styles.recommendBody}>
                    <MapPin size={13} color="#E60076" style={{ marginTop: 2, flexShrink: 0 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recommendType}>{rec.type}</Text>
                      <Text style={styles.recommendText}>{rec.activity}</Text>
                      <Text style={styles.recommendReason}>{rec.reason}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadow.md,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: FontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
  },
  retryBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 48,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    ...Shadow.sm,
  },
  creditText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#9810FA',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    ...Shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  analysisText: {
    fontSize: FontSize.base,
    color: Colors.gray[700],
    lineHeight: 24,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[500],
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  recommendCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  recommendNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recommendNumText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  recommendBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  recommendText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[800],
    lineHeight: 22,
  },
  recommendType: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#9810FA',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  recommendReason: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    lineHeight: 18,
    marginTop: 2,
  },
});
