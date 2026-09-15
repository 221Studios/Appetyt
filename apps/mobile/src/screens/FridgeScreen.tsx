import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { colors, styles } from '../theme';

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[ąćęłńóśźż]/g, (letter) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' })[letter] ?? letter);

export function FridgeScreen({ fridge, recipes, savedIds, onAdd, onRemove, onOpen, onToggleSaved }: { fridge: string[]; recipes: RecipeSummary[]; savedIds: string[]; onAdd: (name: string) => void; onRemove: (name: string) => void; onOpen: (id: string) => void; onToggleSaved: (id: string) => void }) {
  const [value, setValue] = useState('');
  const matching = useMemo(() => recipes.map((recipe) => ({
    recipe,
    score: fridge.filter((item) => recipe.ingredient_names.some((name) => normalize(name).includes(normalize(item)) || normalize(item).includes(normalize(name)))).length,
  })).sort((a, b) => b.score - a.score), [fridge, recipes]);
  const add = () => { if (value.trim()) { onAdd(value.trim()); setValue(''); } };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>Twoja kuchnia</Text><Text style={[styles.title, { marginTop: 4, marginBottom: 8 }]}>Lodówka</Text><Text style={[styles.muted, { marginBottom: 18 }]}>Trzymaj listę składników lokalnie na urządzeniu.</Text>
    <View style={{ flexDirection: 'row', marginBottom: 16 }}><TextInput accessibilityLabel="Dodaj składnik" value={value} onChangeText={setValue} onSubmitEditing={add} placeholder="Dodaj składnik" placeholderTextColor={colors.muted} style={{ flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, borderRadius: 13, paddingHorizontal: 14, color: colors.ink }} /><Pressable accessibilityRole="button" accessibilityLabel="Dodaj składnik" onPress={add} style={[styles.button, { marginLeft: 8, paddingHorizontal: 17 }]}><Text style={styles.buttonText}>Dodaj</Text></Pressable></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 22 }}>{fridge.map((item) => <Pressable key={item} onPress={() => onRemove(item)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 }}><Text style={{ color: colors.green, fontWeight: '700' }}>{item}  ×</Text></Pressable>)}</View>
    <Text style={styles.heading}>Co możesz ugotować?</Text>
    {matching.map(({ recipe, score }) => <View key={recipe.id}><Text style={{ color: colors.green, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>{score > 0 ? `Pasuje do ${score} składników` : 'Uzupełnij lodówkę'}</Text><RecipeCard recipe={recipe} saved={savedIds.includes(recipe.id)} onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} /></View>)}
  </ScrollView>;
}
