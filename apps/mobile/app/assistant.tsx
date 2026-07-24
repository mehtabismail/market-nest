import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { api } from '../src/lib/api';
import { font, formatPrice, radii, size } from '../src/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: BuyerProductListItemDTO[];
}

interface AssistantResponse {
  reply: string;
  products?: BuyerProductListItemDTO[];
}

export default function AssistantScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your MarketNest shopping assistant. Ask me anything — find products, compare options, or get recommendations.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.request<AssistantResponse>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history }),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        products: response.products,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Sorry, I had trouble processing that. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, sending, messages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <ScreenHeader
          title="AI Assistant"
          subtitle="Ask anything"
          back
          backFallback="/"
        />

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.role === 'user'
                  ? [styles.userBubble, { backgroundColor: theme.accent }]
                  : [styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }],
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: message.role === 'user' ? '#ffffff' : theme.text },
                ]}
              >
                {message.content}
              </Text>

              {message.products && message.products.length > 0 ? (
                <View style={styles.productList}>
                  {message.products.slice(0, 4).map((product) => (
                    <PressableScale
                      key={product.id}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${product.title}`}
                      onPress={() => router.push(`/product/${product.id}` as never)}
                      style={[styles.productChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={1}>
                        {product.title}
                      </Text>
                      <Text style={[styles.productPrice, { color: theme.accent }]}>
                        {formatPrice(product.price)}
                      </Text>
                      <Icon name="chevronRight" size={12} color={theme.textMuted} />
                    </PressableScale>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {sending ? (
            <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.accent} />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputBar, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={theme.textFaint}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => void sendMessage()}
            blurOnSubmit={false}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!input.trim() || sending}
            onPress={() => void sendMessage()}
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim() && !sending ? theme.accent : theme.border,
              },
            ]}
          >
            <Icon name="chevronRight" size={18} color="#ffffff" />
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messages: {
    flex: 1,
  },
  bubble: {
    padding: 14,
    borderRadius: radii.card,
    marginBottom: 10,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: size.body,
    fontFamily: font.body,
    lineHeight: size.body * 1.5,
  },
  productList: {
    marginTop: 12,
    gap: 8,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    gap: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: size.small,
    fontFamily: font.bodySemibold,
  },
  productPrice: {
    fontSize: size.small,
    fontFamily: font.bodyBold,
  },
  inputBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.body,
    fontFamily: font.body,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
