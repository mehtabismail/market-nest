import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, type ColorValue } from 'react-native';
import { GlassSurface, supportsGlass } from '../../src/components/glass';
import { colors } from '../../src/theme';

/**
 * Buyer tabs.
 *
 * The bar floats over content on native Liquid Glass so the feed scrolls
 * *under* it — that translucency is the whole point of the effect and is what
 * makes the app read as native rather than a web view in a shell. Where glass is
 * unavailable the bar becomes opaque and stops floating, because a solid bar
 * pinned over content just hides it.
 *
 * Seller features land here later as a second, role-gated tab group, which is
 * why navigation is grouped rather than flat.
 */
export default function TabsLayout() {
  // Filled when active, outline when not — the standard iOS tab idiom.
  const icon =
    (name: keyof typeof Ionicons.glyphMap, active: keyof typeof Ionicons.glyphMap) =>
    ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
      <Ionicons name={focused ? active : name} size={size} color={color as string} />
    );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mid,
        tabBarStyle: supportsGlass
          ? { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0 }
          : { backgroundColor: colors.white, borderTopColor: colors.border },
        tabBarBackground: supportsGlass
          ? () => <GlassSurface style={StyleSheet.absoluteFill as never} />
          : undefined,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerTransparent: supportsGlass,
        headerBackground: supportsGlass
          ? () => <GlassSurface style={StyleSheet.absoluteFill as never} />
          : undefined,
        headerStyle: supportsGlass ? undefined : { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Shop', tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: icon('search-outline', 'search') }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Cart', tabBarIcon: icon('bag-outline', 'bag') }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
