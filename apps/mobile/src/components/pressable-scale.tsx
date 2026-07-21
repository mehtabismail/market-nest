import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { pressScale, spring } from '@marketnest/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Light impact by default. Pass `null` for silent controls. */
  haptic?: Haptics.ImpactFeedbackStyle | null;
}

/**
 * Tappable surface with spring press feedback.
 *
 * Scales rather than dimming: opacity changes read as "disabled", scale reads as
 * "pressed". The spring is interruptible, so a fast second tap redirects instead
 * of queueing behind the first animation.
 *
 * Honours Reduce Motion — the scale is dropped entirely, but haptics and the
 * press itself still fire, so the control never feels unresponsive.
 */
export function PressableScale({
  children,
  style,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        if (!reducedMotion) scale.value = withSpring(pressScale, spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.press);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(haptic);
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
