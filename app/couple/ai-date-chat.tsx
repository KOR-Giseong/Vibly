import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MapPin, List, Plus, Trash2, X, BookmarkPlus, Calendar, Check, ImagePlus } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients } from '@constants/theme';
import { coupleService } from '@services/couple.service';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import ScreenTransition from '@components/ScreenTransition';
import { useLocation } from '@hooks/useLocation';
import { useAiDateChatStore, WELCOME_MSG, type ChatBubble, type ChatSession } from '@stores/aiDateChat.store';
import type { AiChatMessage, Place } from '@/types';

const QUICK_EMOJIS = ['❤️', '😘', '✨', '🎉', '🥰', '😊'];
const MAX_SESSIONS = 10;
const SAVE_ALL_KEYWORDS = ['전체 저장', '다 저장', '코스 저장', '플랜 저장', '전부 저장', '모두 저장', '저장해줘', '저장해', '다저장'];

function formatDate(iso: string) {
  const d = new Date(iso);
  const M = d.getMonth() + 1, D = d.getDate();
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

function formatDisplayDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getLastAiPlaces(messages: ChatBubble[]): Place[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'model' && messages[i].places && messages[i].places!.length > 0) {
      return messages[i].places!;
    }
  }
  return [];
}

function detectSaveIntent(text: string): 'all' | null {
  const lower = text.toLowerCase();
  if (SAVE_ALL_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'all';
  return null;
}

export default function AiDateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { coords } = useLocation();
  const { setPlace } = usePlaceCacheStore();

  const {
    sessions, currentSessionId, currentMessages,
    setCurrentMessages, setCurrentSessionId,
    persistSession, deleteSession, startNewChat, loadSession,
  } = useAiDateChatStore();

  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // 이미지 첨부 state
  const [selectedImage, setSelectedImage] = React.useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setSelectedImage({
        uri: asset.uri,
        base64: asset.base64 ?? '',
        mimeType,
      });
    }
  };

  // 플랜 저장 관련 state
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [pendingPlaces, setPendingPlaces] = React.useState<Place[]>([]);
  const [saveDate, setSaveDate] = React.useState(new Date());
  const [savingAll, setSavingAll] = React.useState(false);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [allSaved, setAllSaved] = React.useState(false);

  const openSaveModal = (places: Place[]) => {
    setPendingPlaces(places);
    setSavedIds(new Set());
    setAllSaved(false);
    setSaveDate(new Date());
    setShowSaveModal(true);
  };

  const saveAll = async () => {
    if (savingAll || pendingPlaces.length === 0) return;
    setSavingAll(true);
    try {
      await Promise.all(
        pendingPlaces.map((p) =>
          coupleService.createDatePlan({
            title: p.name,
            dateAt: saveDate.toISOString(),
            memo: `[AI 데이트 비서] ${p.category ?? '장소'}`,
          })
        )
      );
      setAllSaved(true);
      setSavedIds(new Set(pendingPlaces.map((p) => p.id)));
      Alert.alert('🗓️ 전체 저장 완료', `${pendingPlaces.length}개 플랜이 데이트 탭에 저장됐어요!`);
    } catch {
      Alert.alert('저장 실패', '다시 시도해주세요.');
    } finally {
      setSavingAll(false);
    }
  };

  const saveSingle = async (place: Place) => {
    if (savingId || savedIds.has(place.id)) return;
    setSavingId(place.id);
    try {
      await coupleService.createDatePlan({
        title: place.name,
        dateAt: saveDate.toISOString(),
        memo: `[AI 데이트 비서] ${place.category ?? '장소'}`,
      });
      setSavedIds((prev) => new Set([...prev, place.id]));
      Alert.alert('✅ 저장 완료', `"${place.name}" 플랜이 데이트 탭에 추가됐어요!`);
    } catch {
      Alert.alert('저장 실패', '다시 시도해주세요.');
    } finally {
      setSavingId(null);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && !selectedImage) return;
    if (isLoading) return;

    // 저장 의도 감지 (API 호출 전 가로채기)
    const intent = detectSaveIntent(text);
    if (intent === 'all') {
      const lastPlaces = getLastAiPlaces(currentMessages);
      if (lastPlaces.length > 0) {
        openSaveModal(lastPlaces);
        setInput('');
        return;
      }
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
    }

    const userMsg: ChatBubble = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim() || (selectedImage ? '📷 이미지를 분석해줘' : ''),
      imageUri: selectedImage?.uri,
    };
    const newMessages = [...currentMessages, userMsg];
    setCurrentMessages(newMessages);
    const imgToSend = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history: AiChatMessage[] = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await coupleService.aiDateChat(
        history,
        coords?.lat,
        coords?.lng,
        imgToSend?.base64,
        imgToSend?.mimeType,
      );

      const modelMsg: ChatBubble = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.text,
        places: res.places,
      };
      const finalMessages = [...newMessages, modelMsg];
      setCurrentMessages(finalMessages);
      persistSession(finalMessages, sessionId);
    } catch {
      const errMsgs = [
        ...newMessages,
        { id: (Date.now() + 1).toString(), role: 'model' as const, text: '죄송해요, 잠시 후 다시 시도해주세요 🙏' },
      ];
      setCurrentMessages(errMsgs);
      persistSession(errMsgs, sessionId);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderBubble = ({ item }: { item: ChatBubble }) => {
    const isUser = item.role === 'user';
    const hasCoursePlaces = !isUser && item.places && item.places.length >= 2;
    return (
      <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={{ maxWidth: '80%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
            {/* 이미지 첨부 썸네일 */}
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.bubbleImage} resizeMode="cover" />
            )}
            <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
            {item.places && item.places.length > 0 && (
              <View style={styles.placesWrap}>
                {item.places.map((p) => (
                  <View key={p.id} style={styles.placeRow}>
                    <TouchableOpacity
                      style={styles.placeChip}
                      onPress={() => { setPlace(p.id, p); router.push(`/place/${p.id}`); }}
                      activeOpacity={0.8}
                    >
                      <MapPin size={12} color={Colors.primary[600]} />
                      <Text style={styles.placeChipText} numberOfLines={1}>{p.name}</Text>
                    </TouchableOpacity>
                    {/* 개별 저장 버튼 */}
                    <TouchableOpacity
                      style={[styles.saveOneBtn, savedIds.has(p.id) && styles.saveOneBtnSaved]}
                      onPress={() => {
                        if (!savedIds.has(p.id)) {
                          Alert.alert(
                            '📅 플랜 저장',
                            `"${p.name}"을(를) 데이트 탭에 저장할까요?`,
                            [
                              { text: '취소', style: 'cancel' },
                              { text: '저장', onPress: () => saveSingle(p) },
                            ]
                          );
                        }
                      }}
                      disabled={savingId === p.id}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {savingId === p.id
                        ? <ActivityIndicator size={10} color={Colors.primary[500]} />
                        : savedIds.has(p.id)
                          ? <Check size={12} color="#10B981" />
                          : <BookmarkPlus size={12} color={Colors.primary[500]} />
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* 코스 전체 저장 버튼 (장소 2개 이상인 AI 버블) */}
          {hasCoursePlaces && (
            <TouchableOpacity
              style={styles.saveAllChip}
              onPress={() => openSaveModal(item.places!)}
              activeOpacity={0.8}
            >
              <Calendar size={13} color={Colors.primary[600]} />
              <Text style={styles.saveAllChipText}>📅 이 코스를 플랜으로 저장할까요?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>💬 AI 데이트 비서</Text>
            <Text style={styles.headerSub}>프리미엄 전용</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
            <List size={20} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderBubble}
          ListHeaderComponent={() => (
            <View style={styles.hintBanner}>
              <Text style={styles.hintText}>
                ✨ 데이트 코스를 Vibly AI와 함께 대화하며 계획해보세요!{'\n'}완성되면 플랜으로 저장할 수 있어요.
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.typingWrap}>
            <ActivityIndicator size="small" color={Colors.primary[400]} />
            <Text style={styles.typingText}>AI가 답변을 생성하고 있어요...</Text>
          </View>
        )}

        {/* 입력창 */}
        <View style={[styles.inputWrap, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.emojiRow}>
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity key={e} onPress={() => sendMessage(e)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* 이미지 미리보기 */}
        {selectedImage && (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.imagePreviewClose}
              onPress={() => setSelectedImage(null)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <X size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          {/* 이미지 첨부 버튼 */}
          <TouchableOpacity
            style={[styles.imgPickBtn, selectedImage && styles.imgPickBtnActive]}
            onPress={pickImage}
            disabled={isLoading}
          >
            <ImagePlus size={18} color={selectedImage ? Colors.primary[500] : Colors.gray[400]} />
          </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={Colors.gray[400]}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() && !selectedImage || isLoading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={(!input.trim() && !selectedImage) || isLoading}
            >
              <Send size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </LinearGradient>

      {/* 대화 목록 모달 */}
      <Modal visible={showHistory} animationType="slide" transparent onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대화 목록</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.modalCloseBtn}>
                <X size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                💡 최대 {MAX_SESSIONS}개까지 저장돼요.{'\n'}초과 시 가장 오래된 대화가 자동으로 삭제됩니다.
              </Text>
            </View>

            <TouchableOpacity style={styles.newChatBtn} onPress={() => { startNewChat(); setShowHistory(false); }} activeOpacity={0.8}>
              <Plus size={16} color={Colors.white} />
              <Text style={styles.newChatText}>새 대화 시작</Text>
            </TouchableOpacity>

            {sessions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>저장된 대화가 없어요</Text>
              </View>
            ) : (
              <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
                {sessions.map((session, idx) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.sessionItem, currentSessionId === session.id && styles.sessionItemActive]}
                    onPress={() => { loadSession(session); setShowHistory(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionTitleRow}>
                        <Text style={styles.sessionIdx}>#{sessions.length - idx}</Text>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                      </View>
                      <Text style={styles.sessionDate}>{formatDate(session.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        Alert.alert('삭제', '이 대화를 삭제할까요?', [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => deleteSession(session.id) },
                        ]);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={Colors.gray[400]} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 플랜 저장 모달 */}
      <Modal visible={showSaveModal} animationType="slide" transparent onRequestClose={() => setShowSaveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 플랜으로 저장</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* 날짜 선택 */}
            <View style={styles.dateBtnWrap}>
              <Calendar size={14} color={Colors.primary[500]} />
              <Text style={styles.dateBtnText}>{formatDisplayDate(saveDate)}</Text>
              <TouchableOpacity
                style={styles.dateChangeBtn}
                onPress={() => {
                  const next = new Date(saveDate);
                  next.setDate(next.getDate() + 1);
                  setSaveDate(next);
                }}
              >
                <Text style={styles.dateChangeTxt}>다음 날 →</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.saveSubTitle}>저장할 장소를 선택하거나 전체 저장하세요</Text>

            <ScrollView style={styles.savePlaceList} showsVerticalScrollIndicator={false}>
              {pendingPlaces.map((p) => (
                <View key={p.id} style={styles.savePlaceRow}>
                  <View style={styles.savePlaceInfo}>
                    <MapPin size={14} color={Colors.primary[500]} />
                    <Text style={styles.savePlaceName} numberOfLines={1}>{p.name}</Text>
                    {p.category && <Text style={styles.savePlaceCat}>{p.category}</Text>}
                  </View>
                  <TouchableOpacity
                    style={[styles.saveOneBtn2, savedIds.has(p.id) && styles.saveOneBtnSaved]}
                    onPress={() => saveSingle(p)}
                    disabled={!!savingId || savedIds.has(p.id)}
                  >
                    {savingId === p.id
                      ? <ActivityIndicator size={12} color={Colors.primary[500]} />
                      : savedIds.has(p.id)
                        ? (<><Check size={12} color="#10B981" /><Text style={styles.savedTxt}>저장됨</Text></>)
                        : (<><BookmarkPlus size={12} color={Colors.primary[600]} /><Text style={styles.saveOneTxt}>저장</Text></>)
                    }
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {allSaved ? (
              <View style={styles.allSavedBanner}>
                <Check size={16} color="#10B981" />
                <Text style={styles.allSavedTxt}>전체 코스가 데이트 탭에 저장됐어요!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.saveAllBtn, savingAll && { opacity: 0.6 }]}
                onPress={saveAll}
                disabled={savingAll}
                activeOpacity={0.85}
              >
                {savingAll
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={styles.saveAllBtnTxt}>⚡ 전체 코스 한번에 저장</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900], textAlign: 'center' },
  headerSub: { fontSize: FontSize.xs, color: Colors.primary[500], textAlign: 'center' },
  list: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary[600] },
  bubble: { borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm },
  bubbleUser: { backgroundColor: Colors.primary[500], borderBottomRightRadius: 4 },
  bubbleModel: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.sm, color: Colors.gray[800], lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },
  placesWrap: { marginTop: Spacing.sm, gap: 6 },
  placeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary[100],
  },
  placeChipText: { fontSize: FontSize.xs, color: Colors.primary[600], fontWeight: FontWeight.medium, flex: 1 },
  typingWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm },
  typingText: { fontSize: FontSize.xs, color: Colors.gray[400] },
  inputWrap: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.md, ...Shadow.md },
  emojiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  emojiBtn: { padding: 4 },
  emojiText: { fontSize: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.gray[900],
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.gray[300] },

  // 이미지 첨부
  imgPickBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center',
  },
  imgPickBtnActive: { backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[200] },
  imagePreviewWrap: {
    position: 'relative', alignSelf: 'flex-start',
    marginBottom: Spacing.sm, marginLeft: 4,
  },
  imagePreview: {
    width: 72, height: 72, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.primary[200],
  },
  imagePreviewClose: {
    position: 'absolute', top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.gray[700], alignItems: 'center', justifyContent: 'center',
  },
  bubbleImage: {
    width: 200, height: 150, borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: Spacing.lg, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  noticeBox: {
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary[100],
  },
  noticeText: { fontSize: FontSize.xs, color: Colors.primary[700], lineHeight: 18 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
    backgroundColor: Colors.primary[500], borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  newChatText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyText: { fontSize: FontSize.sm, color: Colors.gray[400] },
  sessionList: { paddingHorizontal: Spacing['2xl'] },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.gray[50],
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.gray[100],
  },
  sessionItemActive: { borderColor: Colors.primary[300], backgroundColor: Colors.primary[50] },
  sessionInfo: { flex: 1, gap: 2 },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sessionIdx: { fontSize: FontSize.xs, color: Colors.primary[400], fontWeight: FontWeight.bold },
  sessionTitle: { fontSize: FontSize.sm, color: Colors.gray[800], fontWeight: FontWeight.medium, flex: 1 },
  sessionDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  deleteBtn: { padding: Spacing.xs },

  // 힌트 배너
  hintBanner: {
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary[100],
  },
  hintText: { fontSize: FontSize.xs, color: Colors.primary[700], lineHeight: 18, textAlign: 'center' },

  // 장소 행 (chip + 개별 저장 버튼)
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveOneBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  saveOneBtnSaved: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },

  // 코스 전체 저장 버튼 (버블 아래)
  saveAllChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary[100], borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginTop: Spacing.xs, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  saveAllChipText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.semibold },

  // 플랜 저장 모달
  dateBtnWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
    backgroundColor: Colors.gray[50], borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.gray[100],
  },
  dateBtnText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[800] },
  dateChangeBtn: { paddingHorizontal: Spacing.sm },
  dateChangeTxt: { fontSize: FontSize.xs, color: Colors.primary[500], fontWeight: FontWeight.medium },
  saveSubTitle: { fontSize: FontSize.xs, color: Colors.gray[500], marginHorizontal: Spacing['2xl'], marginBottom: Spacing.sm },
  savePlaceList: { maxHeight: 220, marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  savePlaceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: Spacing.sm,
  },
  savePlaceInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  savePlaceName: { flex: 1, fontSize: FontSize.sm, color: Colors.gray[800], fontWeight: FontWeight.medium },
  savePlaceCat: { fontSize: FontSize.xs, color: Colors.gray[400] },
  saveOneBtn2: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  saveOneTxt: { fontSize: FontSize.xs, color: Colors.primary[600], fontWeight: FontWeight.medium },
  savedTxt: { fontSize: FontSize.xs, color: '#10B981', fontWeight: FontWeight.medium },
  allSavedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginHorizontal: Spacing['2xl'],
    backgroundColor: '#ECFDF5', borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  allSavedTxt: { fontSize: FontSize.sm, color: '#065F46', fontWeight: FontWeight.medium },
  saveAllBtn: {
    marginHorizontal: Spacing['2xl'], backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  saveAllBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
});
