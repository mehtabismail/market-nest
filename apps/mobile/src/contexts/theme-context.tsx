import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preferences } from '../lib/storage';
import { themes, type MobileTheme } from '../theme';

interface ThemeContextValue {
  theme: MobileTheme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Light/dark is a user choice, not a system mirror.
 *
 * The design exposes an explicit in-app toggle on the Home header, so the app
 * cannot simply follow `useColorScheme()` — a user who picks light on a phone
 * in dark mode must stay in light. The OS preference only seeds the very first
 * launch, before any choice exists to honour.
 */
export function ThemeProvider({
  children,
  initialDark = true,
}: {
  children: React.ReactNode;
  initialDark?: boolean;
}) {
  const [isDark, setIsDark] = useState(initialDark);

  useEffect(() => {
    let cancelled = false;
    void preferences.getTheme().then((stored) => {
      if (!cancelled && stored !== null) setIsDark(stored === 'dark');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(() => {
    setIsDark((current) => {
      const next = !current;
      // Fire-and-forget: a failed write costs the preference next launch, which
      // is not worth blocking the paint the user is waiting on.
      void preferences.setTheme(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: isDark ? themes.dark : themes.light, isDark, toggle }),
    [isDark, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
