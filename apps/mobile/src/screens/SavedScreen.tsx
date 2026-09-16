import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { Icon } from '../components/Icon';
import { presentShelfRecipe } from '../referenceLook';
import { colors, styles as common } from '../theme';

export function SavedScreen({ recipes, savedIds, onOpen, onToggleSaved, onExplore }: { recipes: RecipeSummary[]; savedIds: string[]; onOpen: (id: string) => void; onToggleSaved: (id: string) => void; onExplore: () => void }) {
  const [filter, setFilter] = useState<'all' | 'quick' | 'pasta'>('all');
  const [query, setQuery] = useState('');
  const saved = recipes.filter((recipe) => savedIds.includes(recipe.id)).map(presentShelfRecipe);
  const suggestions = recipes.filter((recipe) => /carbonara|pappardelle|borowik/i.test(`${recipe.id} ${recipe.title}`)).map(presentShelfRecipe).slice(0, 2);
  const filtered = useMemo(() => saved.filter((recipe) => (!query || [recipe.title, recipe.category, recipe.creator?.name ?? ''].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())) && (filter === 'all' || filter === 'quick' && recipe.duration_minutes <= 25 || filter === 'pasta' && /makaron|risotto|pasta|penne|pappardelle/i.test(`${recipe.category} ${recipe.title}`))), [saved, query, filter]);
  return <ScrollView style={common.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={common.title}>Zapisane przepisy</Text>
    <Text style={[common.muted, { marginTop: 3 }]}>Twoja prywatna książka kuchenna ({saved.length})</Text>
    {saved.length > 0 && <View style={styles.search}><Icon name="search" size={20} color={colors.orange} /><TextInput accessibilityLabel="Szukaj w zapisanych" value={query} onChangeText={setQuery} placeholder="Szukaj w swoich zapisanych..." placeholderTextColor={colors.muted} style={styles.input} />{query.length > 0 && <Pressable onPress={() => setQuery('')}><Icon name="close" size={18} color={colors.muted} /></Pressable>}</View>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{([['all', `Wszystkie (${saved.length})`], ['quick', 'Szybkie (<25 min)'], ['pasta', 'Makarony & Risotto']] as const).map(([id, label]) => <Pressable key={id} onPress={() => setFilter(id)} style={[styles.filter, filter === id && styles.filterActive]}><Text style={[styles.filterText, filter === id && styles.filterTextActive]}>{label}</Text></Pressable>)}</ScrollView>
    {filtered.length ? filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} />) : <View style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name="bookmark-border" size={30} color={colors.orange} /></View>
      <Text style={common.heading}>{query ? 'Brak wyników wyszukiwania' : 'Brak zapisanych przepisów'}</Text>
      <Text style={[common.muted, styles.center]}>{query ? `Nie znaleziono dania pasującego do „${query}”.` : 'Kliknij ikonę zakładki przy dowolnym daniu, aby zachować je tutaj.'}</Text>
      {!query && suggestions.length > 0 && <View style={styles.suggestions}><Text style={styles.suggestLabel}>SZYBKIE DODANIE</Text>{suggestions.map((recipe) => <Pressable key={recipe.id} onPress={() => onToggleSaved(recipe.id)} style={styles.suggest}><Icon name="add" size={16} color={colors.orange} /><Text style={styles.suggestText} numberOfLines={1}>{recipe.title}</Text></Pressable>)}</View>}
      <Pressable onPress={onExplore} style={[common.button, { marginTop: 15, paddingHorizontal: 18 }]}><Text style={common.buttonText}>Przeglądaj dania</Text></Pressable>
    </View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 106 },
  search: { height: 44, borderRadius: 12, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 15, gap: 6 },
  input: { flex: 1, color: colors.ink, fontSize: 13 },
  filters: { gap: 7, paddingVertical: 14 },
  filter: { backgroundColor: colors.surface, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: colors.orange },
  filterText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: colors.paper },
  empty: { backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 5 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center', marginTop: 5 },
  suggestions: { width: '100%', marginTop: 14, gap: 8, alignItems: 'center' },
  suggestLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.line, maxWidth: '100%' },
  suggestText: { color: colors.ink, fontSize: 12, fontWeight: '700', flexShrink: 1 },
});
