import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/auth-context';
import { LoadingState } from '../../src/components/states';
import { colors, fontSize, radii, shadow, spacing } from '../../src/theme';

export default function AccountScreen() {
  const { user, loading, isAuthenticated, isBuyer, signOut } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingState />;

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>Sign in to MarketNest</Text>
        <Text style={styles.muted}>
          Track orders, save addresses and check out faster.
        </Text>
        <Pressable style={styles.primary} onPress={() => router.push('/sign-in')}>
          <Text style={styles.primaryLabel}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, shadow('sm')]}>
        <Text style={styles.name}>{user?.fullName ?? 'Your account'}</Text>
        {!isBuyer && (
          // Same account model as web: one identity, several roles. Shopping is
          // a customer capability, so say so plainly rather than letting the API
          // reject the checkout later.
          <Text style={styles.notice}>
            You are signed in as {user?.role === 'superadmin' ? 'an administrator' : 'a seller'}.
            Shopping requires a customer account.
          </Text>
        )}
      </View>

      <Pressable style={[styles.row, shadow('sm')]} onPress={() => router.push('/orders')}>
        <Text style={styles.rowLabel}>Your orders</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={() => void signOut()}>
        <Text style={styles.secondaryLabel}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.ink },
  muted: { fontSize: fontSize.sm, color: colors.mid, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink },
  notice: { fontSize: fontSize.sm, color: colors.accent, lineHeight: 20 },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowLabel: { fontSize: fontSize.base, fontWeight: '600', color: colors.ink },
  primary: {
    marginTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.ink,
  },
  primaryLabel: { color: colors.white, fontWeight: '700' },
  secondary: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryLabel: { color: colors.mid, fontWeight: '600' },
});
