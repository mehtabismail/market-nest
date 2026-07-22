import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/theme-context';
import { font, size } from '../theme';
import { PressableScale } from './pressable-scale';

interface SectionHeadingProps {
  title: string;
  /** Right-aligned link label, e.g. "See all". */
  action?: string;
  onAction?: () => void;
  /** Sits beside the title — countdown pills and status chips. */
  trailing?: React.ReactNode;
}

/** Serif section title with an optional inline chip and trailing link. */
export function SectionHeading({ title, action, onAction, trailing }: SectionHeadingProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text
          style={[styles.title, { color: theme.text }]}
          // Section titles are landmarks; announcing them as headings is what
          // lets a screen-reader user skip between rails.
          accessibilityRole="header"
        >
          {title}
        </Text>
        {trailing}
      </View>

      {action ? (
        <PressableScale accessibilityRole="link" onPress={onAction} haptic={null}>
          <Text style={[styles.action, { color: theme.accent }]}>{action}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: size.lg, fontFamily: font.display },
  action: { fontSize: size.small, fontFamily: font.bodySemibold },
});
