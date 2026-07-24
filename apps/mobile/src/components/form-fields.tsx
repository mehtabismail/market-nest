import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  formatDateYmd,
  parseDateYmd,
  sanitizePkLocalInput,
  toPkE164,
  toPkLocalDigits,
} from '@marketnest/utils';
import { useTheme } from '../contexts/theme-context';
import { font, radii, size } from '../theme';

/** Pakistani mobile with fixed +92 prefix; value stored/returned as E.164. */
export function PhoneField({
  label = 'Phone Number',
  value,
  onChange,
  required,
  error,
}: {
  label?: string;
  value: string;
  onChange: (e164: string) => void;
  required?: boolean;
  error?: string | null;
}) {
  const { theme } = useTheme();
  // Display only the local portion; never re-run country-code logic on keystrokes.
  const local = toPkLocalDigits(value);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View style={[styles.phoneRow, { backgroundColor: theme.card, borderColor: error ? '#ef4444' : theme.border }]}>
        <Text style={[styles.prefix, { color: theme.text, borderColor: theme.border }]}>+92</Text>
        <TextInput
          value={local}
          onChangeText={(text) => {
            const digits = sanitizePkLocalInput(text);
            onChange(digits ? toPkE164(digits) : '');
          }}
          placeholder="3001234567"
          placeholderTextColor={theme.textFaint}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.phoneInput, { color: theme.text }]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function EmailField({
  label = 'Email',
  value,
  onChange,
  required,
  error,
  autoComplete = 'email',
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  error?: string | null;
  autoComplete?: 'email' | 'off';
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="your@email.com"
        placeholderTextColor={theme.textFaint}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        style={[
          styles.input,
          { backgroundColor: theme.card, borderColor: error ? '#ef4444' : theme.border, color: theme.text },
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Opens the system calendar on press; stores YYYY-MM-DD. */
export function DateField({
  label,
  value,
  onChange,
  required,
  maximumDate,
  minimumDate,
  error,
}: {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
  required?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string | null;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseDateYmd(value) ?? new Date(2000, 0, 1), [value]);

  function onPick(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(formatDateYmd(selected));
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          styles.datePressable,
          { backgroundColor: theme.card, borderColor: error ? '#ef4444' : theme.border },
        ]}
      >
        <Text style={{ color: value ? theme.text : theme.textFaint, fontFamily: font.body, fontSize: size.base }}>
          {value || 'Tap to select date'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.doneRow}>
          <Text style={{ color: theme.accent, fontFamily: font.bodySemibold }}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Date + time picker; stores ISO-ish local string suitable for datetime-local APIs. */
export function DateTimeField({
  label,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (isoLocal: string) => void;
  required?: boolean;
  error?: string | null;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const current = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  function commit(next: Date) {
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    const hh = String(next.getHours()).padStart(2, '0');
    const mm = String(next.getMinutes()).padStart(2, '0');
    onChange(`${y}-${m}-${d}T${hh}:${mm}`);
  }

  function onPick(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'dismissed' || !selected) return;
      if (mode === 'date') {
        commit(selected);
        setMode('time');
        setOpen(true);
        return;
      }
      commit(selected);
      setMode('date');
      return;
    }
    if (selected) commit(selected);
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMode('date');
          setOpen(true);
        }}
        style={[
          styles.input,
          styles.datePressable,
          { backgroundColor: theme.card, borderColor: error ? '#ef4444' : theme.border },
        ]}
      >
        <Text style={{ color: value ? theme.text : theme.textFaint, fontFamily: font.body, fontSize: size.base }}>
          {value ? value.replace('T', ' ') : 'Tap to select date & time'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={current}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (mode === 'date') setMode('time');
            else setOpen(false);
          }}
          style={styles.doneRow}
        >
          <Text style={{ color: theme.accent, fontFamily: font.bodySemibold }}>
            {mode === 'date' ? 'Next: time' : 'Done'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 8 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.base,
    fontFamily: font.body,
  },
  datePressable: { justifyContent: 'center' },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.input,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: font.bodySemibold,
    fontSize: size.base,
    borderRightWidth: 1,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: size.base,
    fontFamily: font.body,
  },
  error: { marginTop: 6, color: '#ef4444', fontSize: size.caption, fontFamily: font.bodyMedium },
  doneRow: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
});
