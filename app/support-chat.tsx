import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { supportService } from '@services/support.service';
import { useAuth } from '@hooks/useAuth';

interface ChatMessage {
  id: string;
  body: string;
  imageUrl?: string | null;
  isAdmin: boolean;
  senderId: string;
  createdAt: string;
  readAt?: string | null;
}

interface Ticket {
  id: string;
  status: string;
}

const POLL_INTERVAL = 10000;

export default function SupportChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null); // 미전송 이미지 URI
  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 기존 CHAT 티켓 찾기 or 첫 메시지 입력 대기
  const initialize = useCallback(async () => {
    try {
      const tickets = await supportService.getMyTickets();
      const chatTicket = tickets.find((t: any) => t.type === 'CHAT' && t.status !== 'CLOSED');
      if (chatTicket) {
        setTicket(chatTicket);
        const msgs = await supportService.getMessages(chatTicket.id);
        setMessages(msgs);
      }
    } catch (e) {
      // 신규 사용자: 티켓 없음 (첫 메시지에서 생성)
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 폴링
  useEffect(() => {
    if (!ticket) return;
    pollingRef.current = setInterval(async () => {
      try {
        const msgs = await supportService.getMessages(ticket.id);
        setMessages(msgs);
      } catch (e: any) {
        // 429나 네트워크 에러는 무시 (다음 주기에 재시도)
        if (e?.response?.status !== 429) console.warn('polling error', e);
      }
    }, POLL_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ticket]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !pendingImage) return;
    setSending(true);
    setInputText('');
    const imageToSend = pendingImage;
    setPendingImage(null);
    try {
      let uploadedImageUrl: string | undefined;
      if (imageToSend) {
        setUploadingImage(true);
        uploadedImageUrl = await supportService.uploadImage(imageToSend);
        setUploadingImage(false);
      }
      if (!ticket) {
        // 첫 메시지 → 티켓 + 메시지 동시 생성
        const newTicket = await supportService.submitTicket('1:1 채팅 문의', text || '이미지 첫부', 'CHAT');
        setTicket(newTicket);
        if (uploadedImageUrl || text) {
          await supportService.sendMessage(newTicket.id, text || '', uploadedImageUrl);
        }
        const msgs = await supportService.getMessages(newTicket.id);
        setMessages(msgs);
      } else {
        const msg = await supportService.sendMessage(ticket.id, text || '', uploadedImageUrl);
        setMessages((prev) => [...prev, msg]);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert('전송 실패', e?.response?.data?.message ?? '다시 시도해주세요.');
      setInputText(text);
      setPendingImage(imageToSend);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '문의에 첨부할 사진을 선택하려면 사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = !item.isAdmin;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.adminAvatar}>
            <Text style={styles.adminAvatarText}>V</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleAdmin]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
          ) : null}
          {item.body ? (
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextAdmin]}>
              {item.body}
            </Text>
          ) : null}
          <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={Gradients.background} style={[styles.gradient, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>1:1 채팅 문의</Text>
            <Text style={styles.headerSub}>평균 응답 시간: 1~2 영업일</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 채팅 영역 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={0}
        >
          {/* 안내 배너 */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>🔒 채팅 내용은 문의 해결 후 90일간 보관돼요.</Text>
            <Text style={styles.infoText}>📎 이미지는 10MB 이하만 첨부 가능해요.</Text>
            <Text style={styles.infoText}>⏰ 평균 응답 시간: 1~2 영업일  |  운영 시간: 평일 09:00~18:00</Text>
          </View>
          {messages.length === 0 ? (
            <View style={styles.emptyArea}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>무엇이든 물어보세요</Text>
              <Text style={styles.emptySub}>Vibly 팀이 빠르게 답변해 드릴게요</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              renderItem={renderMessage}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* 입력 영역 */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            {/* 이미지 미리보기 (선택 후 전송 전) */}
            {pendingImage && (
              <View style={styles.pendingImageRow}>
                <Image source={{ uri: pendingImage }} style={styles.pendingImageThumb} />
                <TouchableOpacity style={styles.pendingImageRemove} onPress={() => setPendingImage(null)}>
                  <X size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickImage}
                disabled={sending || uploadingImage}
                activeOpacity={0.7}
              >
                {uploadingImage
                  ? <ActivityIndicator size="small" color={Colors.primary[500]} />
                  : <ImageIcon size={22} color={Colors.gray[400]} />
                }
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={pendingImage ? '선택적 메시지 입력...' : '메시지를 입력하세요'}
                placeholderTextColor={Colors.gray[400]}
                multiline
                maxLength={1000}
                returnKeyType="default"
              />
              <TouchableOpacity
                style={[styles.sendBtn, ((!inputText.trim() && !pendingImage) || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={(!inputText.trim() && !pendingImage) || sending}
                activeOpacity={0.8}
              >
                {sending
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Send size={18} color={Colors.white} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50], alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  headerSub: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 1 },

  chatContainer: { flex: 1 },
  messageList: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.lg },

  emptyArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['4xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[800], marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, gap: Spacing.sm },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },

  adminAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
  },
  adminAvatarText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  bubble: { maxWidth: '72%', borderRadius: BorderRadius.xl, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.primary[600], borderBottomRightRadius: 4 },
  bubbleAdmin: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleImage: { width: 200, height: 160, borderRadius: 10, marginBottom: 4 },
  bubbleText: { fontSize: FontSize.sm, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTextAdmin: { color: Colors.gray[800] },
  bubbleTime: { fontSize: 10, color: Colors.gray[400], marginTop: 4, textAlign: 'right' },

  infoBanner: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  infoText: { fontSize: 11, color: Colors.gray[500], lineHeight: 18 },

  inputBar: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.gray[100],
  },
  pendingImageRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  pendingImageThumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.gray[100] },
  pendingImageRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.gray[600],
    alignItems: 'center', justifyContent: 'center',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gray[50],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gray[200],
  },
  input: {
    flex: 1, backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.gray[200],
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    fontSize: FontSize.md, color: Colors.gray[900],
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: Colors.gray[300] },
});
