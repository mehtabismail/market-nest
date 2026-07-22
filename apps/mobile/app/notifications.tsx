import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { useApi } from '../src/hooks/use-api';
import { api } from '../src/lib/api';
import { font, radii, size } from '../src/theme';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, IconName> = {
  order_update: 'package',
  payout: 'dollar',
  kyc: 'shield',
  promotion: 'gift',
  system: 'bell',
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, reload } = useApi<Notification[]>('/notifications');

  const items = data ?? [];
  const hasUnread = items.some((n) => n.readAt === null);

  async function markAllRead() {
    await api.request('/notifications/read-all', { method: 'POST' });
    await reload();
  }

  async function open(notification: Notification) {
    if (notification.readAt === null) {
      // Fire-and-forget the read write; navigating should not wait on it.
      void api.request(`/notifications/${notification.id}/read`, { method: 'PATCH' }).then(reload);
    }
    if (notification.link) router.push(notification.link as never);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Notifications"
        back
        backFallback="/"
        right={
          hasUnread ? (
            <PressableScale accessibilityRole="button" onPress={() => void markAllRead()} haptic={null}>
              <Text style={[styles.markAll, { color: theme.accent }]}>Mark all read</Text>
            </PressableScale>
          ) : null
        }
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>🔔</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>You&apos;re all caught up</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((notification) => {
            const unread = notification.readAt === null;
            return (
              <PressableScale
                key={notification.id}
                accessibilityRole="button"
                accessibilityLabel={notification.title}
                onPress={() => void open(notification)}
                style={[
                  styles.row,
                  {
                    backgroundColor: unread ? theme.cardAlt : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.iconWell, { backgroundColor: theme.accentWash }]}>
                  <Icon name={TYPE_ICON[notification.type] ?? 'bell'} size={16} color={theme.accent} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{notification.title}</Text>
                  {notification.body ? (
                    <Text style={[styles.rowBody, { color: theme.textMuted }]} numberOfLines={2}>
                      {notification.body}
                    </Text>
                  ) : null}
                  <Text style={[styles.rowTime, { color: theme.textFaint }]}>
                    {formatRelative(notification.createdAt)}
                  </Text>
                </View>
                {unread ? <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} /> : null}
              </PressableScale>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  markAll: { fontSize: size.small, fontFamily: font.bodySemibold },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyGlyph: { fontSize: 44, marginBottom: 12, opacity: 0.4 },
  emptyText: { fontSize: size.base, fontFamily: font.body },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  iconWell: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: size.body, fontFamily: font.bodySemibold },
  rowBody: { fontSize: size.small, fontFamily: font.body, marginTop: 2, lineHeight: size.small * 1.5 },
  rowTime: { fontSize: size.tiny, fontFamily: font.body, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
