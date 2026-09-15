import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ShoppingItem } from '../state/localState';
import { colors, styles } from '../theme';

export function ShoppingScreen({ items, onAdd, onToggle, onClear }: { items: ShoppingItem[]; onAdd: (title: string) => void; onToggle: (id: string) => void; onClear: () => void }) {
  const [value, setValue] = useState('');
  const pending = items.filter((item) => !item.isBought);
  const add = () => { if (value.trim()) { onAdd(value.trim()); setValue(''); } };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>Plan na zakupy</Text><Text style={[styles.title, { marginTop: 4, marginBottom: 8 }]}>Lista zakupów</Text><Text style={[styles.muted, { marginBottom: 18 }]}>{pending.length} {pending.length === 1 ? 'pozycja' : 'pozycje'} do kupienia</Text>
    <View style={{ flexDirection: 'row', marginBottom: 20 }}><TextInput accessibilityLabel="Dodaj do listy zakupów" value={value} onChangeText={setValue} onSubmitEditing={add} placeholder="Dodaj własną pozycję" placeholderTextColor={colors.muted} style={{ flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, borderRadius: 13, paddingHorizontal: 14, color: colors.ink }} /><Pressable onPress={add} style={[styles.button, { marginLeft: 8, paddingHorizontal: 17 }]}><Text style={styles.buttonText}>Dodaj</Text></Pressable></View>
    {items.length === 0 && <View style={styles.card}><Text style={styles.heading}>Lista jest pusta</Text><Text style={styles.muted}>Dodaj brakujące składniki z widoku przepisu albo wpisz je ręcznie.</Text></View>}
    {items.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: item.isBought }} onPress={() => onToggle(item.id)} style={[styles.card, { flexDirection: 'row', alignItems: 'center', opacity: item.isBought ? 0.55 : 1 }]}><Text style={{ fontSize: 24, color: item.isBought ? colors.green : colors.orange, marginRight: 12 }}>{item.isBought ? '☑' : '□'}</Text><View style={{ flex: 1 }}><Text style={[styles.body, item.isBought && { textDecorationLine: 'line-through' }]}>{item.title}</Text>{item.recipeTitle && <Text style={styles.muted}>Do przepisu: {item.recipeTitle}</Text>}</View></Pressable>)}
    {items.some((item) => item.isBought) && <Pressable onPress={onClear} style={styles.ghostButton}><Text style={styles.ghostButtonText}>Usuń kupione</Text></Pressable>}
  </ScrollView>;
}
