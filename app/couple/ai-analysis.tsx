import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Sparkles, BookmarkPlus, Check, Coins, X, Edit2 } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients } from '@constants/theme';
import { coupleService, type AiDateAnalysisResult, type AiDateTimelineItem } from '@services/couple.service';

const WEEKDAYS = ['일','월','화','수','목','금','토'];
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
function fmtDate(d: Date) { return `${d.getFullYear()}년 ${MONTHS[d.getMonth()]} ${d.getDate()}일`; }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function buildCells(y: number, m: number): (Date|null)[] {
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate(), c:(Date|null)[]=[];
  for(let i=0;i<first;i++) c.push(null);
  for(let d=1;d<=days;d++) c.push(new Date(y,m,d));
  return c;
}

function DatePickerModal({ visible, onConfirm, onClose }:{ visible:boolean; onConfirm:(d:Date)=>void; onClose:()=>void; }) {
  const now = new Date();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const [sel, setSel] = useState<Date>(()=>{ const t=new Date(); t.setHours(0,0,0,0); return t; });
  const prev = () => { if(vm===0){setVy(y=>y-1);setVm(11);}else setVm(m=>m-1); };
  const next = () => { if(vm===11){setVy(y=>y+1);setVm(0);}else setVm(m=>m+1); };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={dp.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e:any)=>e.stopPropagation()}>
          <View style={dp.sheet}>
            <View style={dp.hdr}>
              <Text style={dp.hdrTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={onClose}><X size={18} color={Colors.gray[500]} /></TouchableOpacity>
            </View>
            <View style={dp.mRow}>
              <TouchableOpacity onPress={prev} style={dp.nav}><ChevronLeft size={20} color={Colors.gray[600]} /></TouchableOpacity>
              <Text style={dp.mTxt}>{vy}년 {MONTHS[vm]}</Text>
              <TouchableOpacity onPress={next} style={dp.nav}><ChevronRight size={20} color={Colors.gray[600]} /></TouchableOpacity>
            </View>
            <View style={dp.wRow}>
              {WEEKDAYS.map((w,i)=>(<Text key={w} style={[dp.wd,i===0&&{color:'#EF4444'},i===6&&{color:'#3B82F6'}]}>{w}</Text>))}
            </View>
            <View style={dp.grid}>
              {buildCells(vy,vm).map((d,idx)=>{
                if(!d) return <View key={`e${idx}`} style={dp.cell}/>;
                const isSel=sameDay(d,sel), sun=idx%7===0, sat=idx%7===6;
                return (
                  <TouchableOpacity key={d.toISOString()} style={[dp.cell,isSel&&dp.cellS]} onPress={()=>setSel(d)} activeOpacity={0.7}>
                    <Text style={[dp.cTxt,isSel&&dp.cTxtS,!isSel&&sun&&{color:'#EF4444'},!isSel&&sat&&{color:'#3B82F6'}]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={dp.selRow}><Text style={dp.selTxt}>{fmtDate(sel)} 선택됨</Text></View>
            <TouchableOpacity style={dp.cfmBtn} onPress={()=>{onConfirm(sel);onClose();}}>
              <LinearGradient colors={['#9810FA','#E60076']} start={{x:0,y:0}} end={{x:1,y:0}} style={dp.cfmGrad}>
                <Text style={dp.cfmTxt}>이 날짜로 저장</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function RefineModal({ visible, item, onConfirm, onClose }:{
  visible: boolean;
  item: AiDateTimelineItem | null;
  onConfirm: (feedback: string) => Promise<void>;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try { await onConfirm(feedback.trim()); setFeedback(''); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={rf.backdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={(e: any) => e.stopPropagation()}>
            <View style={rf.sheet}>
              <View style={rf.hdr}>
                <View style={rf.hdrLeft}>
                  <Text style={rf.title}>코스 수정하기</Text>
                  {item && <Text style={rf.sub} numberOfLines={1}>{item.emoji} {item.time} · {item.place}</Text>}
                </View>
                <TouchableOpacity onPress={onClose}><X size={18} color={Colors.gray[400]} /></TouchableOpacity>
              </View>
              <TextInput
                style={rf.input}
                placeholder={'어떻게 바꿔드릴까요?\n예) 실내 활동으로 바꿔줘\n예) 더 로맨틱한 장소로'}
                placeholderTextColor={Colors.gray[400]}
                multiline
                maxLength={200}
                value={feedback}
                onChangeText={setFeedback}
              />
              <View style={rf.footer}>
                <View style={rf.creditBadge}>
                  <Coins size={12} color="#9810FA" />
                  <Text style={rf.creditTxt}>2크레딧</Text>
                </View>
                <TouchableOpacity
                  style={[rf.btn, (!feedback.trim() || loading) && { opacity: 0.4 }]}
                  onPress={submit}
                  disabled={!feedback.trim() || loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#9810FA', '#E60076']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={rf.btnGrad}>
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={rf.btnTxt}>수정하기</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TimelineCard({ item, isLast, onSave, onRefine }:{
  item: AiDateTimelineItem;
  isLast: boolean;
  onSave: (item: AiDateTimelineItem, d: Date) => Promise<void>;
  onRefine: () => void;
}) {
  const [picker, setPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirm = async (date: Date) => {
    setSaving(true);
    try { await onSave(item, date); setSaved(true); }
    finally { setSaving(false); }
  };
  return (
    <View style={s.tlRow}>
      <View style={s.tlLeft}>
        <Text style={s.tlTime}>{item.time}</Text>
        <View style={s.tlDot} />
        {!isLast && <View style={s.tlLine} />}
      </View>
      <View style={[s.tlCard, isLast && { marginBottom: 0 }]}>
        <View style={s.tlTop}>
          <View style={s.tlEmojiBubble}><Text style={s.tlEmojiTxt}>{item.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.tlPlace}>{item.place}</Text>
            {item.address && (
              <Text style={s.tlAddress} numberOfLines={1}>{item.address}</Text>
            )}
            <Text style={s.tlAct}>{item.activity}</Text>
          </View>
          <View style={s.tlActions}>
            {saved && <View style={s.savedBadge}><Check size={11} color="#10B981" /><Text style={s.savedTxt}>저장됨</Text></View>}
            <TouchableOpacity style={s.refineBtn} onPress={onRefine} activeOpacity={0.7}>
              <Edit2 size={13} color="#9810FA" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={s.tlTip}>{item.tip}</Text>
        {!saved && (
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={() => setPicker(true)} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator size="small" color="#9810FA" /> : <><BookmarkPlus size={14} color="#9810FA" /><Text style={s.saveBtnTxt}>플랜으로 저장</Text></>}
          </TouchableOpacity>
        )}
        <DatePickerModal visible={picker} onConfirm={confirm} onClose={() => setPicker(false)} />
      </View>
    </View>
  );
}

export default function AiAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userNote } = useLocalSearchParams<{ userNote?: string }>();

  const [result, setResult] = useState<AiDateAnalysisResult | null>(null);
  const [timeline, setTimeline] = useState<AiDateTimelineItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [refineIdx, setRefineIdx] = useState<number | null>(null);
  const [refineVisible, setRefineVisible] = useState(false);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    coupleService.aiDateAnalysis(userNote ?? undefined)
      .then((res) => {
        setResult(res);
        setTimeline(res.timeline ?? []);
        setCredits(res.creditsRemaining);
      })
      .catch((e: any) => setError(e?.response?.data?.message ?? 'AI 분석에 실패했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const savePlan = async (item: AiDateTimelineItem, date: Date) => {
    await coupleService.createDatePlan({
      title: item.activity,
      dateAt: date.toISOString(),
      memo: `[AI 추천] ${item.time} · ${item.place} — ${item.tip}`,
    });
    Alert.alert('✅ 저장 완료', `"${item.activity}" 플랜이 데이트 탭에 추가됐어요!`);
  };

  const openRefine = (idx: number) => {
    setRefineIdx(idx);
    setRefineVisible(true);
  };

  const handleRefine = async (feedback: string) => {
    if (refineIdx === null) return;
    setRefining(true);
    try {
      const res = await coupleService.aiRefineTimeline({ timeline, itemIndex: refineIdx, feedback });
      setTimeline(res.timeline ?? timeline);
      setCredits(res.creditsRemaining);
      setRefineVisible(false);
      setRefineIdx(null);
    } catch (e: any) {
      Alert.alert('수정 실패', e?.response?.data?.message ?? '다시 시도해주세요.');
    } finally {
      setRefining(false);
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={s.headerTxt}>AI 데이트 분석</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <View style={s.ldCard}>
            <LinearGradient colors={['#9810FA', '#E60076']} style={s.ldIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Sparkles size={28} color={Colors.white} />
            </LinearGradient>
            <ActivityIndicator color="#9810FA" size="large" />
            <Text style={s.ldTitle}>AI가 분석 중이에요</Text>
            <Text style={s.ldDesc}>{'북마크와 데이트 기록을 바탕으로\n최적의 코스를 찾고 있어요...'}</Text>
          </View>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52 }}>😥</Text>
          <Text style={s.errTitle}>분석에 실패했어요</Text>
          <Text style={s.errDesc}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
            <Text style={s.retryTxt}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      ) : result ? (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.creditRow}>
            <View style={s.creditBadge}>
              <Coins size={13} color="#9810FA" />
              <Text style={s.creditTxt}>남은 크레딧: <Text style={s.creditNum}>{credits ?? '—'}</Text></Text>
            </View>
          </View>

          <LinearGradient colors={['#9810FA', '#E60076']} style={s.anlCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.anlHdr}><Sparkles size={18} color="#FDE68A" /><Text style={s.anlLabel}>AI 데이트 패턴 분석</Text></View>
            <Text style={s.anlTxt}>{result.analysis}</Text>
          </LinearGradient>

          {timeline.length > 0 && (
            <>
              <View style={s.secHdr}>
                <Text style={s.secTitle}>🗓 오늘의 데이트 코스</Text>
                <Text style={s.secSub}>✏️ 아이콘으로 항목 수정 (2크레딧) · 북마크로 플랜 저장</Text>
              </View>
              <View style={s.tlContainer}>
                {timeline.map((item, idx) => (
                  <TimelineCard
                    key={idx}
                    item={item}
                    isLast={idx === timeline.length - 1}
                    onSave={savePlan}
                    onRefine={() => openRefine(idx)}
                  />
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
            <Text style={s.doneTxt}>데이트 탭에서 확인하기</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}

      <RefineModal
        visible={refineVisible}
        item={refineIdx !== null ? timeline[refineIdx] ?? null : null}
        onConfirm={handleRefine}
        onClose={() => { if (!refining) { setRefineVisible(false); setRefineIdx(null); } }}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTxt: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing['2xl'] },
  ldCard: { backgroundColor: Colors.white, borderRadius: 28, padding: Spacing['3xl'], alignItems: 'center', gap: Spacing.md, ...Shadow.md, width: '100%' },
  ldIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  ldTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  ldDesc: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center', lineHeight: 20 },
  errTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[800] },
  errDesc: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.white, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, ...Shadow.sm },
  retryTxt: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[700] },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  creditRow: { alignItems: 'flex-end' },
  creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#E9D5FF', ...Shadow.sm },
  creditTxt: { fontSize: FontSize.xs, color: Colors.gray[600] },
  creditNum: { fontWeight: FontWeight.bold, color: '#9810FA' },
  anlCard: { borderRadius: 20, padding: 20, gap: 10 },
  anlHdr: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  anlLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FDE68A', letterSpacing: 0.3 },
  anlTxt: { fontSize: FontSize.base, color: Colors.white, lineHeight: 24, opacity: 0.95 },
  secHdr: { gap: 3, marginTop: 4 },
  secTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  secSub: { fontSize: FontSize.xs, color: Colors.gray[400] },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  savedTxt: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#10B981' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F0FF', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  saveBtnTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#9810FA' },
  tlContainer: { gap: 0 },
  tlRow: { flexDirection: 'row', gap: 10 },
  tlLeft: { width: 52, alignItems: 'center', gap: 0 },
  tlTime: { fontSize: 11, fontWeight: FontWeight.bold, color: '#9810FA', marginBottom: 4, letterSpacing: 0.3 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9810FA' },
  tlLine: { width: 2, flex: 1, backgroundColor: '#E9D5FF', marginTop: 2, marginBottom: 0 },
  tlCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 6, marginBottom: 12, ...Shadow.sm },
  tlTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tlEmojiBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tlEmojiTxt: { fontSize: 18 },
  tlPlace: { fontSize: FontSize.xs, color: '#9810FA', fontWeight: FontWeight.semibold },
  tlAddress: { fontSize: 10, color: Colors.gray[400], lineHeight: 14, marginTop: 1 },
  tlAct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gray[900], lineHeight: 18 },
  tlTip: { fontSize: FontSize.xs, color: Colors.gray[500], lineHeight: 17 },
  tlActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  refineBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' },
  doneBtn: { backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...Shadow.sm, marginTop: 4 },
  doneTxt: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[700] },
});

const rf = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  hdr: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hdrLeft: { flex: 1, gap: 3 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  sub: { fontSize: FontSize.xs, color: Colors.gray[500] },
  input: { borderWidth: 1, borderColor: '#E9D5FF', borderRadius: 12, padding: 12, fontSize: FontSize.sm, color: Colors.gray[900], minHeight: 90, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FAF5FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  creditTxt: { fontSize: FontSize.xs, color: '#9810FA', fontWeight: FontWeight.semibold },
  btn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  btnGrad: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.bold },
});

const CELL = 40;
const dp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  sheet: { backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.lg, width: '100%', maxWidth: 360, ...Shadow.sm },
  hdr: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  hdrTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  mRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  nav: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  mTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[800] },
  wRow: { flexDirection: 'row', marginBottom: 4 },
  wd: { width: CELL, textAlign: 'center', fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gray[500], paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: CELL / 2, marginBottom: 2 },
  cellS: { backgroundColor: '#9810FA' },
  cTxt: { fontSize: FontSize.sm, color: Colors.gray[800] },
  cTxtS: { color: Colors.white, fontWeight: FontWeight.bold },
  selRow: { alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray[100], marginTop: Spacing.sm },
  selTxt: { fontSize: FontSize.sm, color: Colors.gray[600], fontWeight: FontWeight.semibold },
  cfmBtn: { borderRadius: 12, overflow: 'hidden', marginTop: Spacing.sm },
  cfmGrad: { paddingVertical: 13, alignItems: 'center' },
  cfmTxt: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
