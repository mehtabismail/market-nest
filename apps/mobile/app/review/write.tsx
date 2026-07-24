import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useTheme } from '../../src/contexts/theme-context';
import { api } from '../../src/lib/api';
import { accents, font, radii, size } from '../../src/theme';

export default function WriteReviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId, title } = useLocalSearchParams<{ productId: string; title?: string }>();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!productId) {
      setError('Missing product ID.');
      return;
    }

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.request('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          rating,
          body: body.trim() || null,
        }),
      });
      if (router.canGoBack()) router.back();
      else router.replace(`/product/${productId}` as never);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not submit review.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Write a Review"
          subtitle={title ? decodeURIComponent(title) : undefined}
          back
          backFallback={productId ? `/product/${productId}` : '/'}
        />

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Your Rating *</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <PressableScale
                key={star}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                onPress={() => {
                  setRating(star);
                  setError(null);
                }}
                haptic={null}
                style={styles.starButton}
              >
                <Icon
                  name="star"
                  size={32}
                  color={star <= rating ? accents.star : theme.textFaint}
                />
              </PressableScale>
            ))}
          </View>
          <Text style={[styles.ratingHint, { color: theme.textMuted }]}>
            {rating === 0
              ? 'Tap a star to rate'
              : rating === 1
                ? 'Poor'
                : rating === 2
                  ? 'Fair'
                  : rating === 3
                    ? 'Good'
                    : rating === 4
                      ? 'Very Good'
                      : 'Excellent'}
          </Text>

          <Text style={[styles.label, { color: theme.textMuted, marginTop: 24 }]}>
            Your Review (optional)
          </Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Share your experience with this product..."
            placeholderTextColor={theme.textFaint}
            multiline
            textAlignVertical="top"
            style={[
              styles.textarea,
              { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
            ]}
          />

          {error ? <Text style={[styles.error, { color: theme.textMuted }]}>{error}</Text> : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Submit review"
            disabled={submitting || rating === 0}
            onPress={() => void handleSubmit()}
            style={[
              styles.submitButton,
              { backgroundColor: theme.accent, opacity: submitting || rating === 0 ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starButton: { padding: 4 },
  ratingHint: { fontSize: size.small, fontFamily: font.body },
  textarea: {
    height: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    fontSize: size.body,
    fontFamily: font.body,
    lineHeight: size.body * 1.5,
  },
  error: { fontSize: size.caption, fontFamily: font.body, marginTop: 12 },
  submitButton: { paddingVertical: 15, borderRadius: radii.tile, alignItems: 'center', marginTop: 20 },
  submitText: { fontSize: size.base, fontFamily: font.bodyBold, color: '#ffffff' },
});
