import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/theme-context';
import { font, radii, size } from '../theme';
import { Icon } from './icon';
import { PressableScale } from './pressable-scale';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows the circular back control. */
  back?: boolean;
  /** Where back goes when there is no history to pop (deep link, cold start). */
  backFallback?: string;
  /** Trailing slot — status pills, actions. */
  right?: React.ReactNode;
}

/**
 * The design's shared page header: serif title, optional subtitle, boxed back
 * control.
 *
 * Back prefers `router.back()` and only falls back to an explicit route when
 * there is no history — a screen reached by deep link has nothing to pop, and
 * always pushing the fallback would strand the user somewhere they never
 * navigated from.
 */
export function ScreenHeader({ title, subtitle, back, backFallback, right }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {back ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else if (backFallback) router.replace(backFallback as never);
          }}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Icon name="back" size={18} color={theme.text} />
        </PressableScale>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>

      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: size.xl,
    fontFamily: font.display,
    lineHeight: size.xl * 1.1,
  },
  subtitle: {
    fontSize: size.caption,
    fontFamily: font.body,
    marginTop: 1,
  },
});
