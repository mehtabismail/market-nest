import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './icon';
import { PressableScale } from './pressable-scale';
import { useTheme } from '../contexts/theme-context';
import { font, radii, size } from '../theme';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface FilterState {
  categoryId: string | null;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
  semantic?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initial: FilterState;
  categories: Category[];
  showSemantic?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export function ProductFilters({
  visible,
  onClose,
  onApply,
  initial,
  categories,
  showSemantic = false,
}: ProductFiltersProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [semantic, setSemantic] = useState(initial.semantic ?? false);

  function handleReset() {
    setCategoryId(null);
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setSemantic(false);
  }

  function handleApply() {
    onApply({ categoryId, minPrice, maxPrice, sort, semantic: showSemantic ? semantic : undefined });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.bg,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Filters</Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Icon name="x" size={16} color={theme.text} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ selected: categoryId === null }}
                onPress={() => setCategoryId(null)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: categoryId === null ? theme.accent : theme.card,
                    borderColor: categoryId === null ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: categoryId === null ? '#ffffff' : theme.textMuted },
                  ]}
                >
                  All
                </Text>
              </PressableScale>
              {categories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <PressableScale
                    key={cat.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? theme.accent : theme.card,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: selected ? '#ffffff' : theme.textMuted }]}
                    >
                      {cat.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Price Range</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Text style={[styles.priceLabel, { color: theme.textFaint }]}>Min</Text>
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="0"
                  placeholderTextColor={theme.textFaint}
                  keyboardType="numeric"
                  style={[
                    styles.priceInput,
                    { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                  ]}
                />
              </View>
              <Text style={[styles.priceDash, { color: theme.textMuted }]}>—</Text>
              <View style={styles.priceField}>
                <Text style={[styles.priceLabel, { color: theme.textFaint }]}>Max</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="∞"
                  placeholderTextColor={theme.textFaint}
                  keyboardType="numeric"
                  style={[
                    styles.priceInput,
                    { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Sort By</Text>
            <View style={styles.sortGrid}>
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value;
                return (
                  <PressableScale
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSort(option.value)}
                    style={[
                      styles.sortChip,
                      {
                        backgroundColor: selected ? theme.accent : theme.card,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.sortText, { color: selected ? '#ffffff' : theme.textMuted }]}
                    >
                      {option.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {showSemantic ? (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Smart Search</Text>
                <PressableScale
                  accessibilityRole="switch"
                  accessibilityState={{ checked: semantic }}
                  onPress={() => setSemantic((s) => !s)}
                  style={[
                    styles.toggleRow,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.toggleContent}>
                    <Text style={[styles.toggleTitle, { color: theme.text }]}>AI-Powered</Text>
                    <Text style={[styles.toggleSubtitle, { color: theme.textMuted }]}>
                      Find products by meaning, not just keywords
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: semantic ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        {
                          backgroundColor: '#ffffff',
                          transform: [{ translateX: semantic ? 16 : 0 }],
                        },
                      ]}
                    />
                  </View>
                </PressableScale>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              onPress={handleReset}
              style={[styles.resetBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.resetText, { color: theme.textMuted }]}>Reset</Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              onPress={handleApply}
              style={[styles.applyBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Converts filter state to URL query params, omitting empty values. */
export function filtersToParams(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.semantic) params.set('semantic', 'true');
  return params.toString();
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: size.xl,
    fontFamily: font.display,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: size.caption,
    fontFamily: font.bodySemibold,
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: size.small,
    fontFamily: font.bodySemibold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceField: {
    flex: 1,
  },
  priceLabel: {
    fontSize: size.tiny,
    fontFamily: font.body,
    marginBottom: 4,
  },
  priceInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    fontSize: size.body,
    fontFamily: font.body,
  },
  priceDash: {
    fontSize: size.body,
    marginTop: 18,
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
  },
  sortText: {
    fontSize: size.small,
    fontFamily: font.bodySemibold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: size.body,
    fontFamily: font.bodySemibold,
  },
  toggleSubtitle: {
    fontSize: size.caption,
    fontFamily: font.body,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 28,
    borderRadius: 14,
    padding: 4,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.tile,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetText: {
    fontSize: size.base,
    fontFamily: font.bodySemibold,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radii.tile,
    alignItems: 'center',
  },
  applyText: {
    fontSize: size.base,
    fontFamily: font.bodyBold,
    color: '#ffffff',
  },
});
