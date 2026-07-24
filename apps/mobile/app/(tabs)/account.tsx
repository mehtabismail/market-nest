import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { useAuth } from '../../src/contexts/auth-context';
import { useTheme } from '../../src/contexts/theme-context';
import { useApi } from '../../src/hooks/use-api';
import { useWishlist } from '../../src/hooks/use-wishlist';
import { avatarGradient, font, glow, radii, size } from '../../src/theme';

interface MenuItem {
  icon: IconName;
  label: string;
  meta?: string;
  route?: string;
  onPress?: () => void;
}

interface OrdersResponse {
  items: unknown[];
  total: number;
}

interface ReviewableResponse {
  items: { productId: string }[];
}

export default function AccountScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isSeller, signOut } = useAuth();
  const wishlist = useWishlist();

  const { data: ordersData } = useApi<OrdersResponse>(user ? '/orders' : null, [user?.id]);
  const { data: reviewableData } = useApi<ReviewableResponse>(user ? '/reviews/reviewable' : null, [user?.id]);

  const ordersCount = ordersData?.total ?? 0;
  const wishlistCount = wishlist.ids.size;
  const reviewsCount = reviewableData?.items?.length ?? 0;

  const buyerItems: MenuItem[] = [
    { icon: 'package', label: 'My Orders', meta: 'Track & manage', route: '/orders' },
    { icon: 'heart', label: 'Wishlist', meta: 'Saved items', route: '/wishlist' },
    { icon: 'pin', label: 'Addresses', meta: 'Delivery locations', route: '/addresses' },
  ];

  const sellerItems: MenuItem[] = [
    { icon: 'chart', label: 'Seller Dashboard', meta: 'Analytics & stats', route: '/seller' },
    { icon: 'store', label: 'My Products', meta: 'Manage listings', route: '/seller/listings' },
    { icon: 'dollar', label: 'Payouts', meta: 'Earnings & history', route: '/seller/payouts' },
    { icon: 'shield', label: 'KYC Status', meta: isSeller ? 'View status' : 'Get verified', route: '/kyc' },
  ];

  const accountItems: MenuItem[] = [
    { icon: 'bell', label: 'Notifications', route: '/notifications' },
    { icon: 'gift', label: 'Rewards & Coupons', route: '/rewards' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
    {
      icon: 'signOut',
      label: user ? 'Sign Out' : 'Sign In',
      onPress: () => {
        if (user) void signOut();
        else router.push('/sign-in' as never);
      },
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity */}
      <View style={styles.identity}>
        <LinearGradient colors={avatarGradient(isDark)} style={[styles.avatar, glow(theme, 20)]}>
          <Text style={styles.avatarGlyph}>👤</Text>
        </LinearGradient>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName ?? 'Guest User'}</Text>
          <Text style={[styles.email, { color: theme.textMuted }]}>
            {user ? 'Signed in' : 'Sign in to access all features'}
          </Text>
          {isSeller ? (
            <View style={[styles.badge, { backgroundColor: theme.accentWash, borderColor: theme.accentGlow }]}>
              <Text style={[styles.badgeText, { color: theme.accent }]}>⭐ Seller Account</Text>
            </View>
          ) : null}
        </View>
        {user ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push('/profile-edit' as never)}
            style={[styles.editButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Icon name="edit" size={15} color={theme.text} />
          </PressableScale>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { label: 'Orders', value: ordersCount.toString() },
          { label: 'Reviews', value: reviewsCount.toString() },
          { label: 'Wishlist', value: wishlistCount.toString() },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <MenuGroup title="Buyer" items={buyerItems} />
      {/* Only shown once the account holds a store — the seller routes hit
          seller-only endpoints, so a buyer would 403 on them. */}
      {isSeller ? <MenuGroup title="Seller Central" items={sellerItems} /> : null}
      <MenuGroup title="Account" items={accountItems} />

      {/* Start selling CTA */}
      {!isSeller ? (
        <View style={[styles.sellCta, { backgroundColor: theme.accentWash, borderColor: theme.accentGlow }]}>
          <LinearGradient colors={avatarGradient(isDark)} style={[styles.sellIcon, glow(theme, 16)]}>
            <Icon name="store" size={20} color="#ffffff" />
          </LinearGradient>
          <View style={styles.flex}>
            <Text style={[styles.sellTitle, { color: theme.text }]}>Start Selling on MarketNest</Text>
            <Text style={[styles.sellBody, { color: theme.textMuted }]}>Complete KYC & go live in 24h</Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push((user ? '/kyc' : '/sign-in') as never)}
            style={[styles.sellButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.sellButtonText}>Sell Now</Text>
          </PressableScale>
        </View>
      ) : null}
    </ScrollView>
  );
}

function MenuGroup({ title, items }: { title: string; items: MenuItem[] }) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {items.map((item, index) => (
          <PressableScale
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => (item.onPress ? item.onPress() : item.route ? router.push(item.route as never) : undefined)}
            style={[
              styles.menuRow,
              index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null,
            ]}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.cardAlt }]}>
              <Icon name={item.icon} size={15} color={theme.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              {item.meta ? <Text style={[styles.menuMeta, { color: theme.textMuted }]}>{item.meta}</Text> : null}
            </View>
            <Icon name="chevronRight" size={13} color={theme.textFaint} />
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarGlyph: { fontSize: 30 },
  name: { fontSize: size.xl, fontFamily: font.display, lineHeight: size.xl * 1.1 },
  email: { fontSize: size.small, fontFamily: font.body, marginTop: 2 },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9.5, fontFamily: font.bodyBold },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { paddingHorizontal: 20, flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, padding: 11, borderRadius: radii.card, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: font.display },
  statLabel: { fontSize: size.tiny, fontFamily: font.body, marginTop: 2 },
  group: { marginTop: 20, paddingHorizontal: 20 },
  groupTitle: { fontSize: size.tiny, fontFamily: font.bodyBold, letterSpacing: 0.8, marginBottom: 8 },
  groupCard: { borderRadius: radii.tile, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: size.body, fontFamily: font.bodyMedium },
  menuMeta: { fontSize: size.caption, fontFamily: font.body },
  sellCta: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: radii.tile,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sellTitle: { fontSize: size.body, fontFamily: font.bodyBold },
  sellBody: { fontSize: size.caption, fontFamily: font.body },
  sellButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.control },
  sellButtonText: { fontSize: size.caption, fontFamily: font.bodyBold, color: '#ffffff' },
});
