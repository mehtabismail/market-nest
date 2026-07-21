import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { duration, stagger } from '@marketnest/tokens';

/**
 * Entrance animation for list and grid items.
 *
 * Items rise slightly as they fade in — upward motion reads as content arriving,
 * which matches the direction the eye already travels down a feed. The cascade is
 * capped so a long list does not leave the last row animating a full second after
 * the first.
 *
 * Reanimated's layout animations are skipped automatically when the system
 * Reduce Motion setting is on, so no extra guard is needed here.
 */
export function FadeInItem({ index = 0, children }: { index?: number; children: ReactNode }) {
  const delay = Math.min(index, stagger.maxItems) * stagger.item;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(duration.enter).springify()}>
      {children}
    </Animated.View>
  );
}

/** Plain fade, for content that replaces something already on screen. */
export function FadeInView({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(duration.enter)}>
      {children}
    </Animated.View>
  );
}
