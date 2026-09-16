import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { searchRecipes } from '../searchRecipes';
import { colors, styles } from '../theme';

export function SearchScreen({ recipes, savedIds, onOpen, onToggleSaved, onAddFridge }: { recipes: RecipeSummary[]; savedIds: string[]; onOpen: (id: string) => void; onToggleSaved: (id: string) => void; onAddFridge: (name: string) => void }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchRecipes(recipes, query), [query, recipes]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>Odkrywaj</Text><Text style={[styles.title, { marginTop: 4 }]}>Szukaj przepisów</Text>
    <TextInput accessibilityLabel="Szukaj przepisów" value={query} onChangeText={setQuery} placeholder="np. makaron, szybkie danie" placeholderTextColor={colors.muted} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.paper, padding: 15, marginVertical: 18, color: colors.ink, fontSize: 16 }} />
    <Text style={styles.heading}>Szybko dodaj do lodówki</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>{['Jajka', 'Pomidory', 'Ryż', 'Szpinak'].map((name) => <Pressable key={name} onPress={() => onAddFridge(name)} style={{ backgroundColor: colors.orangeSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, marginRight: 8, marginBottom: 8 }}><Text style={{ color: colors.orange, fontWeight: '700' }}>+ {name}</Text></Pressable>)}</View>
    <Text style={styles.heading}>{results.length} wyników</Text>
    {results.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={savedIds.includes(recipe.id)} onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} />)}
  </ScrollView>;
}
