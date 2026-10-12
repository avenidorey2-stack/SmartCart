import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { categorize, type Category } from '@/lib/categorize';
import { cents } from '@/lib/format';

export type Item = {
  id: string;
  name: string;
  price: number; // unit price
  qty: number;
  unit: string; // "jar", "box", "ea"
  category: Category;
  checked: boolean;
  source: 'manual' | 'scan';
  createdAt: number;
};

export type NewItem = Pick<Item, 'name' | 'price'> & Partial<Pick<Item, 'qty' | 'unit' | 'category' | 'source'>>;

type ListState = {
  title: string;
  store: string;
  budget: number;
  items: Item[];
  collapsed: Partial<Record<Category, boolean>>;

  addItem: (item: NewItem) => Item;
  updateItem: (id: string, patch: Partial<Omit<Item, 'id'>>) => void;
  removeItem: (id: string) => void;
  toggleChecked: (id: string) => void;
  toggleCollapsed: (category: Category) => void;
  setBudget: (budget: number) => void;
  setDetails: (title: string, store: string) => void;
  uncheckAll: () => void;
  clearChecked: () => void;
  clearAll: () => void;
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const SEED: Item[] = [
  ['Greek Yogurt', 5.49, 1, 'jar', 'DAIRY'],
  ['Sharp Cheddar', 2.99, 1, 'pack', 'DAIRY'],
  ['Penne Pasta', 1.49, 2, 'box', 'PANTRY'],
  ['Olive Oil', 8.99, 1, 'bottle', 'PANTRY'],
  ['Avocados', 1.25, 4, 'ea', 'PRODUCE'],
  ['Baby Spinach', 3.49, 1, 'bag', 'PRODUCE'],
].map(([name, price, qty, unit, category], i) => ({
  id: `seed-${i}`,
  name: name as string,
  price: price as number,
  qty: qty as number,
  unit: unit as string,
  category: category as Category,
  checked: false,
  source: 'manual' as const,
  createdAt: i,
}));

export const useListStore = create<ListState>()(
  persist(
    (set) => ({
      title: 'Weekly Groceries',
      store: "Trader Joe's",
      budget: 100,
      items: SEED,
      collapsed: {},

      addItem: (input) => {
        const item: Item = {
          id: uid(),
          name: input.name.trim(),
          price: cents(input.price),
          qty: Math.max(1, Math.round(input.qty ?? 1)),
          unit: input.unit?.trim() || 'ea',
          category: input.category ?? categorize(input.name),
          checked: false,
          source: input.source ?? 'manual',
          createdAt: Date.now(),
        };
        // Expand the category so the new item is visible immediately.
        set((s) => ({ items: [...s.items, item], collapsed: { ...s.collapsed, [item.category]: false } }));
        return item;
      },
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, ...patch, price: cents(patch.price ?? it.price) } : it,
          ),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
      toggleChecked: (id) =>
        set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) })),
      toggleCollapsed: (category) =>
        set((s) => ({ collapsed: { ...s.collapsed, [category]: !s.collapsed[category] } })),
      setBudget: (budget) => set({ budget: cents(Math.max(0, budget)) }),
      setDetails: (title, store) => set({ title: title.trim() || 'My List', store: store.trim() }),
      uncheckAll: () => set((s) => ({ items: s.items.map((it) => ({ ...it, checked: false })) })),
      clearChecked: () => set((s) => ({ items: s.items.filter((it) => !it.checked) })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'smartcart-list',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const lineTotal = (it: Item) => cents(it.price * it.qty);

/** Spent = running total of everything in the cart; each added/scanned item is deducted from the budget. */
export function useBudget() {
  const budget = useListStore((s) => s.budget);
  const items = useListStore((s) => s.items);
  const spent = cents(items.reduce((sum, it) => sum + lineTotal(it), 0));
  const remaining = cents(budget - spent);
  const progress = budget > 0 ? Math.min(spent / budget, 1) : spent > 0 ? 1 : 0;
  return { budget, spent, remaining, progress, over: remaining < 0 };
}
