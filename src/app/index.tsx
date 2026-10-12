import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBar, DOCK_CLEARANCE } from '@/components/BottomBar';
import { BudgetCard } from '@/components/BudgetCard';
import { DetailsSheet } from '@/components/DetailsSheet';
import { ItemRow } from '@/components/ItemRow';
import { ItemSheet } from '@/components/ItemSheet';
import { MenuSheet, type MenuAction } from '@/components/MenuSheet';
import { CATEGORIES, type Category } from '@/lib/categorize';
import { money, sentenceCase } from '@/lib/format';
import { lineTotal, useBudget, useListStore, type Item } from '@/store/useListStore';
import { colors, eyebrow, fonts, radius } from '@/theme';

type Section = { category: Category; count: number; data: Item[] };

export default function ListScreen() {
  const { title, store, items, collapsed, toggleChecked, toggleCollapsed, uncheckAll, clearChecked, clearAll } =
    useListStore();
  const { budget, spent, remaining } = useBudget();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [itemSheet, setItemSheet] = useState(false);
  const [detailsSheet, setDetailsSheet] = useState(false);
  const [menu, setMenu] = useState(false);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const visible = q ? items.filter((it) => it.name.toLowerCase().includes(q)) : items;
    return CATEGORIES.map((category) => {
      const inCat = visible.filter((it) => it.category === category);
      // While searching, always expand so matches are visible.
      return { category, count: inCat.length, data: collapsed[category] && !q ? [] : inCat };
    }).filter((s) => s.count > 0);
  }, [items, collapsed, query]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setItemSheet(true);
  }, []);
  const openEdit = useCallback((item: Item) => {
    setEditing(item);
    setItemSheet(true);
  }, []);

  const share = () => {
    const lines = CATEGORIES.flatMap((c) => {
      const inCat = items.filter((it) => it.category === c);
      if (!inCat.length) return [];
      return [
        `\n${c}`,
        ...inCat.map((it) => `${it.checked ? '☑' : '☐'} ${it.name} — ${money(it.price)} × ${it.qty} ${it.unit}`),
      ];
    });
    Share.share({
      message: [
        `🛒 ${title}${store ? ` (${store})` : ''}`,
        `Budget ${money(budget)} · Spent ${money(spent)} · Remaining ${money(remaining)}`,
        ...lines,
      ].join('\n'),
    });
  };

  const confirm = (message: string, action: () => void) => {
    // Alert.alert is a no-op in the browser.
    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
      return;
    }
    Alert.alert(message, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: action },
    ]);
  };

  const menuActions: MenuAction[] = [
    { label: 'Edit budget & list name', icon: 'wallet-outline', onPress: () => setDetailsSheet(true) },
    { label: 'Uncheck all items', icon: 'refresh', onPress: uncheckAll },
    {
      label: 'Remove checked items',
      icon: 'checkmark-done-outline',
      onPress: () => confirm('Remove all checked items?', clearChecked),
    },
    { label: 'Clear list', icon: 'trash-outline', destructive: true, onPress: () => confirm('Remove every item?', clearAll) },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top app bar: store and actions, then the list name (tap to edit) */}
      <View style={styles.appBar}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrow} numberOfLines={1}>
            {store || 'SmartCart'}
          </Text>
        </View>
        <IconButton
          name={searching ? 'close' : 'search'}
          label="Search"
          onPress={() => {
            setSearching((s) => !s);
            setQuery('');
          }}
        />
        <IconButton name="share-outline" label="Share list" onPress={share} />
        <IconButton name="ellipsis-horizontal" label="More options" onPress={() => setMenu(true)} />
      </View>
      <Pressable style={styles.header} onPress={() => setDetailsSheet(true)} accessibilityHint="Edit list name and store">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>

      {searching ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            style={styles.search}
            placeholder="Search your list"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}

      {/* Sticky budget tracker — lives outside the scroll view so it never scrolls away. */}
      <View style={styles.budgetWrap}>
        <BudgetCard onPress={() => setDetailsSheet(true)} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: DOCK_CLEARANCE, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => {
          const isCollapsed = !!collapsed[section.category] && !query;
          const subtotal = items.filter((it) => it.category === section.category).reduce((s, it) => s + lineTotal(it), 0);
          return (
            <Pressable
              style={styles.sectionHeader}
              onPress={() => toggleCollapsed(section.category)}
              accessibilityRole="button"
              accessibilityState={{ expanded: !isCollapsed }}
            >
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionTitle}>{sentenceCase(section.category)}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.sectionCount}>{section.count}</Text>
                </View>
              </View>
              <View style={styles.sectionRight}>
                <Text style={styles.subtotal}>{money(subtotal)}</Text>
                <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={colors.textFaint} />
              </View>
            </Pressable>
          );
        }}
        renderItem={({ item, index, section }) => (
          <ItemRow
            item={item}
            index={index}
            last={index === section.data.length - 1}
            onToggle={toggleChecked}
            onPress={openEdit}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="basket-outline" size={30} color={colors.brand} />
            </View>
            <Text style={styles.emptyTitle}>
              {query ? 'Nothing matches ' : 'A fresh '}
              <Text style={{ fontFamily: fonts.displayItalic }}>{query ? `“${query}”` : 'list.'}</Text>
            </Text>
            {!query ? <Text style={styles.emptyText}>Add your first item, or scan a shelf price tag.</Text> : null}
          </View>
        }
      />

      <BottomBar onAdd={openAdd} onScan={() => router.push('/scan')} />

      <ItemSheet visible={itemSheet} item={editing} onClose={() => setItemSheet(false)} />
      <DetailsSheet visible={detailsSheet} onClose={() => setDetailsSheet(false)} />
      <MenuSheet visible={menu} actions={menuActions} onClose={() => setMenu(false)} />
    </SafeAreaView>
  );
}

function IconButton({
  name,
  label,
  onPress,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.sunken }]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={name} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  appBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 16, paddingTop: 6 },
  header: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 14 },
  eyebrowRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  eyebrow: { ...eyebrow, color: colors.textMuted },
  title: { fontFamily: fonts.display, fontSize: 46, lineHeight: 50, letterSpacing: -1.5, color: colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, minWidth: 0, paddingVertical: 12, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  budgetWrap: { zIndex: 2, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.displayItalic, fontSize: 24, color: colors.text },
  countPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.sunken },
  sectionCount: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtotal: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, textAlign: 'center', color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
