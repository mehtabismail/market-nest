import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/icon';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenHeader } from '../src/components/screen-header';
import { useTheme } from '../src/contexts/theme-context';
import { font, radii, size } from '../src/theme';

export default function SettingsScreen() {
  const { theme, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'To delete your account, please contact support at support@marketnest.com',
      [{ text: 'OK' }],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Settings" back backFallback="/account" />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
              <Icon name="eye" size={16} color={theme.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
                {isDark ? 'Currently dark' : 'Currently light'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: theme.border, true: theme.accentWash }}
              thumbColor={isDark ? theme.accent : theme.textFaint}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>LEGAL</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
              <Icon name="edit" size={16} color={theme.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Terms of Service</Text>
            </View>
          </View>
          <Text style={[styles.legalText, { color: theme.textMuted }]}>
            By using MarketNest, you agree to our Terms of Service. You must be at least 18 years
            old to create an account. All purchases are subject to our return and refund policies.
            We reserve the right to suspend or terminate accounts that violate our community
            guidelines. For the full terms, visit marketnest.com/terms.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
              <Icon name="shield" size={16} color={theme.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Privacy Policy</Text>
            </View>
          </View>
          <Text style={[styles.legalText, { color: theme.textMuted }]}>
            Your privacy matters to us. We collect only the information necessary to provide our
            services, including your name, email, shipping addresses, and order history. We do not
            sell your personal data to third parties. You can request deletion of your data at any
            time. For full details, visit marketnest.com/privacy.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT</Text>
        <PressableScale
          accessibilityRole="button"
          onPress={handleDeleteAccount}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Icon name="trash" size={16} color="#ef4444" />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete Account</Text>
              <Text style={[styles.rowMeta, { color: theme.textMuted }]}>Contact support</Text>
            </View>
            <Icon name="chevronRight" size={13} color={theme.textFaint} />
          </View>
        </PressableScale>
      </View>

      <Text style={[styles.version, { color: theme.textFaint }]}>MarketNest v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: size.tiny, fontFamily: font.bodyBold, letterSpacing: 0.8, marginBottom: 10 },
  card: { borderRadius: radii.tile, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: size.body, fontFamily: font.bodyMedium },
  rowMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 1 },
  legalText: {
    fontSize: size.small,
    fontFamily: font.body,
    lineHeight: size.small * 1.6,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  version: { textAlign: 'center', fontSize: size.tiny, fontFamily: font.body, marginTop: 24 },
});
