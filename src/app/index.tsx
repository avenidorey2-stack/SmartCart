import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBar } from '@/components/BottomBar';
import { BudgetCard } from '@/components/BudgetCard';
import { DetailsSheet } from '@/components/DetailsSheet';
import { ItemRow } from '@/components/ItemRow';
import { ItemSheet } from '@/components/ItemSheet';
import { MenuSheet, type MenuAction } from '@/components/MenuSheet';
import { CATEGORIES, type Category } from '@/lib/categorize';
import { money } from '@/lib/format';
import { lineTotal, useBudget, useListStore, type Item } from '@/store/useListStore';
import { colors } from '@/theme';

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

  const confirm = (message: string, action: () => void) =>
    Alert.alert(message, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: action },
    ]);

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
      {/* Top app bar */}
      <View style={styles.appBar}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.canGoBack() && router.back()} />
        <View style={{ flex: 1 }} />
        <IconButton
          name={searching ? 'close' : 'search'}
          label="Search"
          onPress={() => {
            setSearching((s) => !s);
            setQuery('');
          }}
        />
        <IconButton name="share-outline" label="Share list" onPress={share} />
        <IconButton name="ellipsis-vertical" label="More options" onPress={() => setMenu(true)} />
      </View>

      {searching ? (
        <TextInput
          style={styles.search}
          placeholder="Search items"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
        />
      ) : (
        <Pressable style={styles.header} onPress={() => setDetailsSheet(true)}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {store ? <Text style={styles.store}>{store}</Text> : null}
        </Pressable>
      )}

      {/* Sticky budget tracker — lives outside the scroll view so it never scrolls away. */}
      <View style={styles.budgetWrap}>
        <BudgetCard onPress={() => setDetailsSheet(true)} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.sectionTitle}>
                {section.category} <Text style={styles.sectionCount}>({section.count})</Text>
              </Text>
              <View style={styles.sectionRight}>
                {isCollapsed ? <Text style={styles.subtotal}>{money(subtotal)}</Text> : null}
                <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={colors.textFaint} />
              </View>
            </Pressable>
          );
        }}
        renderItem={({ item }) => <ItemRow item={item} onToggle={toggleChecked} onPress={openEdit} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="basket-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>
              {query ? `No items match “${query}”` : 'Your list is empty.\nTap + to add an item or scan a price tag.'}
            </Text>
          </View>
        }
      />

      <BottomBar onMic={openAdd} onAdd={openAdd} onScan={() => router.push('/scan')} />

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
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn} accessibilityLabel={label} accessibilityRole="button">
      <Ionicons name={name} size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 52 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  store: { fontSize: 15, color: colors.textFaint, marginTop: 2 },
  search: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    fontSize: 16,
    color: colors.text,
  },
  budgetWrap: { zIndex: 2, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.6 },
  sectionCount: { color: colors.textFaint },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtotal: { fontSize: 13, color: colors.textFaint },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
