import { forwardRef, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type View as RNView,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { useAuth } from '../../src/contexts/auth-context';
import { useCartCount } from '../../src/hooks/use-cart-count';
import { useTheme } from '../../src/contexts/theme-context';
import { ctaGradient, font, radii } from '../../src/theme';

/**
 * Built on the headless `expo-router/ui` tabs rather than the styled `Tabs`
 * navigator.
 *
 * The design's bar is a floating pill with a raised action button punched
 * through its centre — not a tab bar with decoration on top. The headless API
 * hands over layout entirely, so the pill can be positioned and the middle gap
 * opened without fighting a navigator that wants to own the bar.
 */

interface TabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
  label: string;
  badgeCount?: number;
}

const TabButton = forwardRef<RNView, TabButtonProps>(
  ({ icon, label, badgeCount = 0, isFocused, style, ...rest }, ref) => {
    const { theme } = useTheme();

    // `style` is pulled out of the spread: TabTrigger types it as a possible
    // callback, which Pressable's array form does not accept, and the extra
    // margins we pass are always a plain object anyway.
    return (
      <Pressable
        ref={ref}
        {...rest}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        style={[styles.tab, style as StyleProp<ViewStyle>]}
      >
        <View style={[styles.tabIcon, isFocused ? { backgroundColor: theme.accentWash } : null]}>
          <Icon name={icon} size={20} color={isFocused ? theme.accent : theme.textMuted} />
          {badgeCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <Text style={styles.badgeText} allowFontScaling={false}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? theme.accent : theme.textFaint,
              fontFamily: isFocused ? font.bodyBold : font.body,
            },
          ]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </Pressable>
    );
  },
);
TabButton.displayName = 'TabButton';

/**
 * The floating "sell" action.
 *
 * Routes to KYC when signed in and to sign-in otherwise: starting a
 * verification wizard whose answers cannot be saved is worse than being asked
 * to sign in first.
 */
function SellFab({ barBottom }: { barBottom: number }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    // Mirrors the design's 3s `pulseGlow`. Shadow radius is not animatable on
    // Android, so this drives a scaling halo behind the button instead — same
    // read, and it stays on the compositor thread.
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.22 }],
  }));

  return (
    <View
      style={[styles.fabSlot, { bottom: barBottom + 28 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fabHalo, { backgroundColor: theme.accent }, haloStyle]}
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Start selling"
        onPress={() => router.push((user ? '/kyc' : '/sign-in') as never)}
        style={styles.fabPressable}
      >
        <LinearGradient
          colors={ctaGradient(isDark)}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.fab}
        >
          <Icon name="plus" size={26} color="#ffffff" />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

export default function TabsLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useCartCount();
  const barBottom = Math.max(insets.bottom, 12);

  return (
    <Tabs>
      <TabSlot />

      {/* TabList must be a direct child of Tabs (or reachable only through
          Fragments): expo-router's headless Tabs finds its routes by walking
          this tree for TabList/TabTrigger, and a wrapping View makes it stop
          short, throwing "Couldn't find any screens for the navigator." So the
          FAB and pill are positioned independently instead of sharing a
          wrapper View. */}
      <SellFab barBottom={barBottom} />
      <TabList
        style={[
          styles.pill,
          styles.barPosition,
          {
            bottom: barBottom,
            backgroundColor: theme.navBg,
            borderColor: theme.glassBorder,
            shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.4)',
          },
        ]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home" label="Home" />
        </TabTrigger>

        {/* The 32pt inner margins on these two open the 64pt slot the FAB
            sits in, without a spacer element TabList would try to route. */}
        <TabTrigger name="search" href="/search" asChild>
          <TabButton icon="search" label="Explore" style={styles.leftOfFab} />
        </TabTrigger>

        <TabTrigger name="cart" href="/cart" asChild>
          <TabButton icon="bag" label="Cart" badgeCount={cartCount} style={styles.rightOfFab} />
        </TabTrigger>

        <TabTrigger name="account" href="/account" asChild>
          <TabButton icon="user" label="Profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barPosition: { position: 'absolute', left: 12, right: 12 },
  pill: {
    height: 66,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  leftOfFab: { marginRight: 32 },
  rightOfFab: { marginLeft: 32 },
  fabSlot: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  fabHalo: { position: 'absolute', top: 0, width: 56, height: 56, borderRadius: 28 },
  fabPressable: { borderRadius: 28 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2 },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontFamily: font.bodyBold, color: '#ffffff' },
  tabLabel: { fontSize: 9.5, letterSpacing: 0.2 },
});
