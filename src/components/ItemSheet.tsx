import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CATEGORIES, categorize, type Category } from '@/lib/categorize';
import { money, parseMoney } from '@/lib/format';
import { useListStore, type Item } from '@/store/useListStore';
import { colors, eyebrow, fonts, radius } from '@/theme';

import { Sheet } from './Sheet';

type Props = {
  visible: boolean;
  /** Item being edited; null/undefined = add a new item. */
  item?: Item | null;
  onClose: () => void;
};

export function ItemSheet({ visible, item, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={item ? 'Edit item' : 'Add item'}>
      {/* Modal unmounts its children when hidden, so the form starts fresh on every open. */}
      <ItemForm key={item?.id ?? 'new'} item={item ?? null} onClose={onClose} />
    </Sheet>
  );
}

function ItemForm({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const addItem = useListStore((s) => s.addItem);
  const updateItem = useListStore((s) => s.updateItem);
  const removeItem = useListStore((s) => s.removeItem);

  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? item.price.toFixed(2) : '');
  const [qty, setQty] = useState(item?.qty ?? 1);
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [category, setCategory] = useState<Category | null>(item?.category ?? null); // null = auto-detect

  const parsedPrice = parseMoney(price);
  const valid = name.trim().length > 0 && parsedPrice !== null;
  const shownCategory = category ?? (name.trim() ? categorize(name) : null);

  const save = () => {
    if (!valid) return;
    const data = { name: name.trim(), price: parsedPrice!, qty, unit: unit.trim() || 'ea', category: shownCategory ?? 'OTHER' };
    if (item) updateItem(item.id, data);
    else addItem(data);
    onClose();
  };

  return (
    <>
      <TextInput
        style={styles.input}
        placeholder="Item name"
        placeholderTextColor={colors.textFaint}
        value={name}
        onChangeText={setName}
        autoFocus={!item}
        returnKeyType="next"
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Price ($)"
          placeholderTextColor={colors.textFaint}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Unit (jar, box…)"
          placeholderTextColor={colors.textFaint}
          value={unit}
          onChangeText={setUnit}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <View style={styles.stepper}>
          <StepButton icon="remove" onPress={() => setQty((q) => Math.max(1, q - 1))} label="Decrease quantity" />
          <Text style={styles.qty}>{qty}</Text>
          <StepButton icon="add" onPress={() => setQty((q) => Math.min(99, q + 1))} label="Increase quantity" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => {
          const on = shownCategory === c;
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable onPress={save} disabled={!valid} style={[styles.primary, !valid && { opacity: 0.4 }]}>
        <Text style={styles.primaryText}>
          {item ? 'Save' : 'Add to list'}
          {parsedPrice !== null ? ` · ${money(parsedPrice * qty)}` : ''}
        </Text>
      </Pressable>
      {item ? (
        <Pressable
          onPress={() => {
            removeItem(item.id);
            onClose();
          }}
          style={styles.secondary}
        >
          <Text style={[styles.secondaryText, { color: colors.danger }]}>Remove from list</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function StepButton({ icon, onPress, label }: { icon: 'add' | 'remove'; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.step} hitSlop={6} accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

export const formStyles = StyleSheet.create({
  label: { ...eyebrow, color: colors.textMuted, marginBottom: 8 },
  input: {
    minWidth: 0, // web <input> has an intrinsic width that otherwise overflows flex rows
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { fontFamily: fonts.bold, color: colors.onBrand, fontSize: 16 },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textMuted },
});

const styles = StyleSheet.create({
  ...formStyles,
  row: { flexDirection: 'row', gap: 12 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: fonts.display, fontSize: 26, minWidth: 24, textAlign: 'center', color: colors.text },
  chips: { gap: 8, paddingVertical: 4, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, letterSpacing: 0.8 },
  chipTextOn: { color: colors.lime },
});
