import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/theme-context';
import { radii, spacing } from '../theme';

/**
 * Shimmer placeholder.
 *
 * A skeleton that mirrors the shape of the content it replaces beats a spinner:
 * the layout is already correct when data lands, so nothing jumps, and the wait
 * reads as progress rather than a stall.
 *
 * Under Reduce Motion the shimmer holds still at a mid opacity — the shape still
 * communicates "loading" without the looping animation.
 */
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { theme } = useTheme();
  const progress = useSharedValue(0.4);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[{ backgroundColor: theme.cardAlt, borderRadius: radii.chip }, style, animatedStyle]}
    />
  );
}

/** Matches ProductCard's grid footprint so the grid does not reflow on load. */
export function ProductCardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Skeleton style={styles.thumb} />
      <View style={styles.body}>
        <Skeleton style={styles.line} />
        <Skeleton style={styles.lineShort} />
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cell}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.tile, borderWidth: 1, overflow: 'hidden' },
  thumb: { width: '100%', height: 118, borderRadius: 0 },
  body: { padding: spacing.md, gap: spacing.sm },
  line: { height: 12, width: '90%' },
  lineShort: { height: 12, width: '45%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: 24 },
  cell: { width: '47%' },
});
