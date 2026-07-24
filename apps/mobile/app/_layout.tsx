import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplash } from '../src/components/animated-splash';
import { AuthProvider } from '../src/contexts/auth-context';
import { CartProvider } from '../src/contexts/cart-context';
import { ThemeProvider, useTheme } from '../src/contexts/theme-context';
import { WishlistProvider } from '../src/hooks/use-wishlist';

// Held until fonts resolve. The design leans hard on Cormorant Garamond for
// every heading, and a flash of system serif before it swaps is the most
// visible possible way to get the typography wrong.
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* Auth and the seller wizard are modals: they interrupt a flow rather
            than continuing one, and both need the tab bar out of the way. */}
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sign-up" options={{ presentation: 'modal' }} />
        <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kyc" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // The animated launch sequence plays over the app until it dismisses itself.
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Hand the native (static) splash off to the animated one the instant fonts
    // are ready. Both sit on the same #030906 canvas, so there is no flash —
    // the animated sequence simply begins building up from black.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Cart and wishlist sit inside Auth: both re-read when the session
            changes, so they must be able to observe it. */}
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* The app mounts underneath immediately, so it is fully warmed
                  by the time the splash fades out. */}
              <RootNavigator />
              {!splashDone ? <AnimatedSplash onFinish={() => setSplashDone(true)} /> : null}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
