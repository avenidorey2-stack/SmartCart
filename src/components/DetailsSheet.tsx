import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { parseMoney } from '@/lib/format';
import { useListStore } from '@/store/useListStore';
import { colors } from '@/theme';

import { formStyles as styles } from './ItemSheet';
import { Sheet } from './Sheet';

/** Edit the list's budget, name and store. */
export function DetailsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="List & budget">
      <DetailsForm onClose={onClose} />
    </Sheet>
  );
}

function DetailsForm({ onClose }: { onClose: () => void }) {
  const { budget, title, store, setBudget, setDetails } = useListStore();
  const [budgetText, setBudgetText] = useState(budget.toFixed(2));
  const [titleText, setTitleText] = useState(title);
  const [storeText, setStoreText] = useState(store);

  const parsed = parseMoney(budgetText);

  const save = () => {
    if (parsed === null) return;
    setBudget(parsed);
    setDetails(titleText, storeText);
    onClose();
  };

  return (
    <>
      <Text style={styles.label}>Budget ($)</Text>
      <TextInput style={styles.input} value={budgetText} onChangeText={setBudgetText} keyboardType="decimal-pad" selectTextOnFocus />
      <Text style={styles.label}>List name</Text>
      <TextInput style={styles.input} value={titleText} onChangeText={setTitleText} />
      <Text style={styles.label}>Store</Text>
      <TextInput style={styles.input} value={storeText} onChangeText={setStoreText} placeholder="Optional" placeholderTextColor={colors.textFaint} />
      <Pressable onPress={save} disabled={parsed === null} style={[styles.primary, parsed === null && { opacity: 0.4 }]}>
        <Text style={styles.primaryText}>Save</Text>
      </Pressable>
    </>
  );
}
