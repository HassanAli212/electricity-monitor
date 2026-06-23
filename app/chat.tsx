// app/chat.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { auth } from '../lib/firebaseConfig';

// CMD mein `ipconfig` run karo aur IPv4 Address yahan daalo:
const API_URL = 'http://localhost:5000';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const SUGGESTIONS = [
  'Mera total electricity usage kitna hai?',
  'Abhi kitne watts use ho rahe hain?',
  'Is mahine ka bill kitna aayega?',
  'Koi alert hai?',
];

const LOADING_MESSAGES = [
  'Soch raha hoon...',
  'Data check kar raha hoon...',
  'Thoda time lag raha hai, AI server busy hai...',
  'Bas thodi der aur, almost ho gaya...',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: '⚡ Assalam-o-Alaikum! Main aapka electricity assistant hoon. Apne usage, bill, ya alerts ke baare mein kuch bhi poochhein.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Loading ke dauran har 3 second baad message change karo
  useEffect(() => {
    if (loading) {
      setLoadingMsgIndex(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingMsgIndex((prev) =>
          prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 3000);
    } else if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Last 10 messages ko history ke tor pe bhejo (current message ke bina)
      // Taake AI ko pichli baatcheet ka context yaad rahe (session ke andar)
      const recentHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, userId, history: recentHistory }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || 'Koi jawab nahi mila.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: '❌ Server se connect nahi ho saka. Dobara try karein.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && <Text style={styles.aiLabel}>⚡ AI</Text>}
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚡ AI Assistant</Text>
          <Text style={styles.headerSub}>Electricity Monitor</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={styles.typingText}>{LOADING_MESSAGES[loadingMsgIndex]}</Text>
          </View>
        )}

        {/* Quick suggestions (show only at start) */}
        {messages.length <= 1 && !loading && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Kuch poochhein..."
            placeholderTextColor="#3A4A6B"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            onKeyPress={(e: any) => {
              // Web/desktop par Enter dabane se message send ho (Shift+Enter se naya line)
              if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault?.();
                sendMessage(input);
              }
            }}
            returnKeyType="send"
            blurOnSubmit={true}
            editable={!loading}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: BG },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle:    { color: '#FFD700', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  headerSub:      { color: '#3A4A6B', fontSize: 12, marginTop: 2 },
  messageList:    { padding: 16, paddingBottom: 8 },
  bubble:         { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 10 },
  userBubble:     { alignSelf: 'flex-end', backgroundColor: '#FFD700', borderBottomRightRadius: 4 },
  aiBubble:       { alignSelf: 'flex-start', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderBottomLeftRadius: 4 },
  aiLabel:        { color: '#FFD700', fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  userText:       { color: '#0A0F1E', fontWeight: '600' },
  aiText:         { color: '#E2E8F0' },
  typingRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  typingText:     { color: '#3A4A6B', fontSize: 13 },
  suggestions:    { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip:           { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 6 },
  chipText:       { color: '#AAB4C8', fontSize: 13 },
  inputRow:       { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: BORDER, gap: 8 },
  input:          { flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, color: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:        { backgroundColor: '#FFD700', borderRadius: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.4 },
  sendIcon:       { color: '#0A0F1E', fontSize: 16, fontWeight: '800' },
});