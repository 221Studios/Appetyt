import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '../api/client';
import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { Icon } from '../components/Icon';
import { tap } from '../haptics';
import { REFERENCE_CHEFS, SearchSeed, ingredientIconName, presentShelfRecipe } from '../referenceLook';
import { searchRecipes } from '../searchRecipes';
import { colors, styles as common } from '../theme';

const pantry = [
  { name: 'Makaron', hint: 'spaghetti, penne, pappardelle' },
  { name: 'Jajka', hint: 'świeże, na śniadanie' },
  { name: 'Pomidory', hint: 'krojone, passata' },
  { name: 'Szpinak', hint: 'świeży lub mrożony' },
  { name: 'Ryż', hint: 'biały, basmati' },
  { name: 'Czosnek', hint: 'główka, pasty' },
];

export function SearchScreen({ recipes, savedIds, fridge, following, seed, catalogTotal, onOpen, onToggleSaved, onAddFridge, onToggleFollow, onOpenChef }: { recipes: RecipeSummary[]; savedIds: string[]; fridge: string[]; following: string[]; seed?: SearchSeed | null; catalogTotal?: number; onOpen: (id: string) => void; onToggleSaved: (id: string) => void; onAddFridge: (name: string) => void; onToggleFollow: (chefId: string) => void; onOpenChef: (chefId: string) => void }) {
  const [query, setQuery] = useState(seed?.query ?? '');
  const [scope, setScope] = useState<'all' | 'recipes' | 'chefs' | 'ingredients'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxTime, setMaxTime] = useState<'30' | '45' | 'any'>(seed?.maxTime ?? 'any');
  const [cuisine, setCuisine] = useState(seed?.cuisine ?? 'Wszystkie');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [remoteRecipes, setRemoteRecipes] = useState<RecipeSummary[]>([]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtersActive = cuisine !== 'Wszystkie' || maxTime !== 'any' || verifiedOnly;
  useEffect(() => {
    if (!seed) return;
    if (seed.query !== undefined) setQuery(seed.query);
    if (seed.cuisine) setCuisine(seed.cuisine);
    if (seed.maxTime) setMaxTime(seed.maxTime);
    setScope('recipes');
  }, [seed]);
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setRemoteRecipes([]);
        return;
      }
      void api.searchRecipes(q).then((response) => {
        if (!cancelled) setRemoteRecipes(response.items);
      }).catch(() => {
        if (!cancelled) setRemoteRecipes(searchRecipes(recipes, q));
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, recipes]);
  const filteredRecipes = useMemo(() => (normalizedQuery ? remoteRecipes : recipes)
    .map(presentShelfRecipe)
    .filter((recipe) => (maxTime === '30' ? recipe.duration_minutes <= 30 : maxTime === '45' ? recipe.duration_minutes <= 45 : true))
    .filter((recipe) => !cuisine || cuisine === 'Wszystkie' || (recipe.cuisine ?? '').toLocaleLowerCase().includes(cuisine.toLocaleLowerCase()) || recipe.category.toLocaleLowerCase().includes(cuisine.toLocaleLowerCase()) || recipe.title.toLocaleLowerCase().includes(cuisine.toLocaleLowerCase()))
    .filter((recipe) => !verifiedOnly || Boolean(looksVerified(recipe)))
    .slice(0, 24), [normalizedQuery, remoteRecipes, recipes, maxTime, cuisine, verifiedOnly]);
  const showRecipes = normalizedQuery !== '' || filtersActive;
  const chefs = useMemo(() => REFERENCE_CHEFS.filter((chef) => !normalizedQuery || chef.name.toLocaleLowerCase().includes(normalizedQuery) || chef.id.includes(normalizedQuery) || normalizedQuery === 'makaron'), [normalizedQuery]);
  const ingredients = useMemo(() => {
    if (!normalizedQuery) return pantry.slice(0, 3);
    if (normalizedQuery.includes('makaron')) return [{ name: 'Makaron pappardelle', hint: 'wstążki' }, { name: 'Makaron spaghetti', hint: 'klasyka' }, { name: 'Makaron penne', hint: 'rurki' }];
    return pantry.filter((item) => item.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);
  const total = (normalizedQuery ? filteredRecipes.length : 0) + chefs.length + ingredients.length;
  const displayedRecipes = scope === 'chefs' || scope === 'ingredients' ? [] : filteredRecipes;

  return <View style={common.screen}>
    <ScrollView style={common.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.searchInputWrap}>
        <Icon name="search" size={22} color={colors.orange} />
        <TextInput accessibilityLabel="Wyszukiwarka dań, szefów i składników" value={query} onChangeText={setQuery} placeholder="Szukaj dań, szefów, składników..." placeholderTextColor={colors.muted} style={styles.searchInput} autoCapitalize="none" />
        {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Wyczyść zapytanie" onPress={() => setQuery('')}><Icon name="cancel" size={20} color={colors.muted} /></Pressable>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRow}>
        {([['all', `Wszystko (${total})`], ['recipes', `Przepisy (${normalizedQuery ? filteredRecipes.length : 0})`], ['chefs', `Szefowie (${chefs.length})`], ['ingredients', `Składniki (${ingredients.length})`]] as const).map(([id, label]) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: scope === id }} onPress={() => setScope(id)} style={[styles.scopeChip, scope === id && styles.scopeActive]}><Text style={[styles.scopeText, scope === id && styles.scopeTextActive]}>{label}</Text></Pressable>)}
        <Pressable accessibilityRole="button" accessibilityLabel="Otwórz filtry wyszukiwania" onPress={() => setFiltersOpen(true)} style={styles.filterButton}><Icon name="tune" size={16} color={colors.orange} /><Text style={styles.filterText}>Filtruj</Text><Icon name="expand-more" size={16} color={colors.muted} /></Pressable>
      </ScrollView>
      <View style={styles.appliedRow}>
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.applied}><Icon name="schedule" size={14} color={colors.muted} /><Text style={styles.appliedText}>{maxTime === 'any' ? 'Dowolny czas' : `< ${maxTime} min`}</Text></Pressable>
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.applied}><Icon name="public" size={14} color={colors.muted} /><Text style={styles.appliedText}>{cuisine}</Text></Pressable>
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.applied}><Icon name="verified" size={14} color={colors.muted} /><Text style={styles.appliedText}>{verifiedOnly ? 'Zweryfikowane' : 'Dowolne źródło'}</Text></Pressable>
      </View>
      {!normalizedQuery && <View style={styles.hint}><Text style={common.muted}>Zacznij pisać albo wybierz sugestię.{catalogTotal ? ` W katalogu jest ${catalogTotal.toLocaleString('pl-PL')} przepisów — na półce widać wybór, reszta jest w wyszukiwarce.` : ''}</Text><View style={styles.chips}>{['makaron', 'carbonara', 'szakszuka', 'zupa'].map((item) => <Pressable key={item} onPress={() => setQuery(item)} style={styles.chip}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View></View>}

      {(scope === 'all' || scope === 'chefs') && chefs.length > 0 && <Section title="Szefowie i autorzy" count={`${chefs.length} trafień`}><View>{chefs.map((chef) => {
        const isFollowing = following.includes(chef.id);
        return <Pressable key={chef.id} onPress={() => { tap(); onOpenChef(chef.id); }} style={styles.creatorRow}>
          <Image source={{ uri: chef.avatarUrl }} style={styles.creatorAvatar} />
          <View style={styles.creatorCopy}>
            <View style={styles.creatorNameRow}><Text style={styles.creatorName}>{chef.name}</Text><Icon name="verified" size={16} color={colors.orange} /></View>
            <Text style={common.muted}>{chef.recipesCount} przepisów</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Obserwuj ${chef.name}`} onPress={() => { tap(); onToggleFollow(chef.id); }} style={[styles.followButton, isFollowing && styles.followActive]}>
            <Icon name="favorite" size={20} color={isFollowing ? colors.orange : colors.muted} />
          </Pressable>
        </Pressable>;
      })}</View></Section>}

      {(scope === 'all' || scope === 'ingredients') && ingredients.length > 0 && <Section title="Składniki w spiżarni" count="Akcje lodówki"><View>{ingredients.map((ingredient) => {
        const inFridge = fridge.some((item) => item.toLocaleLowerCase().includes(ingredient.name.split(' ')[0].toLocaleLowerCase()) || ingredient.name.toLocaleLowerCase().includes(item.toLocaleLowerCase()));
        return <View key={ingredient.name} style={styles.ingredientRow}>
          <View style={styles.ingredientIcon}><Icon name={ingredientIconName(ingredient.name)} size={20} color={colors.orange} /></View>
          <View style={styles.ingredientCopy}><Text style={styles.creatorName}>{ingredient.name}</Text><Text style={common.muted}>{inFridge ? 'W Twojej lodówce' : ingredient.hint ?? 'Brak w Twojej lodówce'}</Text></View>
          <Pressable onPress={() => onAddFridge(ingredient.name)} style={[styles.fridgeAction, inFridge && styles.fridgeActionDone]}>
            <Icon name={inFridge ? 'check' : 'add-circle'} size={16} color={inFridge ? colors.green : colors.paper} />
            <Text style={[styles.fridgeActionText, inFridge && styles.fridgeActionDoneText]}>{inFridge ? 'W lodówce' : 'Do lodówki'}</Text>
          </Pressable>
        </View>;
      })}</View></Section>}

      {(scope === 'all' || scope === 'recipes') && showRecipes && <Section title={normalizedQuery ? `Wyniki: „${query.trim()}”` : 'Przepisy w wybranym filtrze'} count={`${displayedRecipes.length} znalezionych`}>
        {displayedRecipes.length ? displayedRecipes.map((recipe) => {
          const matched = recipe.ingredient_names.filter((name) => fridge.some((item) => name.toLocaleLowerCase().includes(item.toLocaleLowerCase()) || item.toLocaleLowerCase().includes(name.toLocaleLowerCase()))).length;
          return <RecipeCard key={recipe.id} recipe={recipe} saved={savedIds.includes(recipe.id)} onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} matchLabel={fridge.length ? `${matched}/${recipe.ingredient_count} w lodówce` : undefined} />;
        }) : <View style={styles.empty}><Icon name="search-off" size={40} color={colors.muted} /><Text style={common.heading}>Nie znaleziono przepisów</Text><Text style={[common.muted, { textAlign: 'center', marginTop: 5 }]}>Spróbuj „makaron”, „carbonara” albo zresetuj filtry.</Text><Pressable onPress={() => { setQuery('makaron'); setCuisine('Wszystkie'); setMaxTime('any'); }} style={[common.button, { marginTop: 14, paddingHorizontal: 18 }]}><Text style={common.buttonText}>Pokaż makarony</Text></Pressable></View>}
      </Section>}
    </ScrollView>
    <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}><Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
      <View style={styles.handle} />
      <View style={styles.sheetHeader}><Text style={common.heading}>Filtry wyszukiwania</Text><Pressable accessibilityLabel="Zamknij panel filtrów" onPress={() => setFiltersOpen(false)}><Icon name="close" size={22} color={colors.muted} /></Pressable></View>
      <Text style={styles.filterLabel}>Maksymalny czas przygotowania</Text>
      <View style={styles.optionRow}>{([['30', '< 30 min'], ['45', '< 45 min'], ['any', 'Dowolny']] as const).map(([id, label]) => <Pressable key={id} onPress={() => setMaxTime(id)} style={[styles.option, maxTime === id && styles.optionActive]}><Text style={[styles.optionText, maxTime === id && styles.optionTextActive]}>{label}</Text></Pressable>)}</View>
      <Text style={styles.filterLabel}>Kuchnia świata</Text>
      <View style={styles.optionRow}>{['Włoska', 'Polska', 'Azjatycka', 'Wszystkie'].map((item) => <Pressable key={item} onPress={() => setCuisine(item)} style={[styles.option, cuisine === item && styles.optionActive]}><Text style={[styles.optionText, cuisine === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.filterLabel}>Źródło przepisów</Text>
      <View style={styles.optionRow}>{[{ id: false, label: 'Dowolne źródło' }, { id: true, label: 'Tylko zweryfikowani' }].map((item) => <Pressable key={item.label} onPress={() => setVerifiedOnly(item.id)} style={[styles.option, verifiedOnly === item.id && styles.optionActive]}><Text style={[styles.optionText, verifiedOnly === item.id && styles.optionTextActive]}>{item.label}</Text></Pressable>)}</View>
      <View style={styles.sheetActions}><Pressable onPress={() => { setMaxTime('any'); setCuisine('Wszystkie'); setVerifiedOnly(false); }} style={[common.ghostButton, { flex: 1 }]}><Text style={common.ghostButtonText}>Resetuj</Text></Pressable><Pressable onPress={() => setFiltersOpen(false)} style={[common.button, { flex: 2 }]}><Text style={common.buttonText}>Zastosuj ({filteredRecipes.length})</Text></Pressable></View>
    </Pressable></Pressable></Modal>
  </View>;
}

function looksVerified(recipe: RecipeSummary) {
  return Boolean(recipe.creator) || /jakubiak|fogel|makłowicz|maklowicz|foxx/i.test(recipe.title);
}

function Section({ title, count, children }: { title: string; count: string; children: ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><Text style={common.heading}>{title}</Text><Text style={styles.sectionCount}>{count}</Text></View>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 105 },
  searchInputWrap: { height: 48, backgroundColor: colors.paper, borderRadius: 13, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  scopeRow: { gap: 7, paddingVertical: 13 },
  scopeChip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  scopeActive: { backgroundColor: colors.orange },
  scopeText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  scopeTextActive: { color: colors.paper },
  filterButton: { minHeight: 36, paddingHorizontal: 11, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  appliedRow: { flexDirection: 'row', gap: 7, marginBottom: 7 },
  applied: { backgroundColor: colors.surfaceLow, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  appliedText: { color: colors.muted, fontSize: 10 },
  hint: { backgroundColor: colors.surfaceLow, borderRadius: 14, padding: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { backgroundColor: colors.paper, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.line },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  section: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionCount: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  creatorRow: { backgroundColor: colors.paper, borderRadius: 15, padding: 11, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line },
  creatorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.orangeSoft },
  creatorCopy: { flex: 1, minWidth: 0 },
  creatorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creatorName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  followButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  followActive: { backgroundColor: colors.orangeSoft },
  ingredientRow: { backgroundColor: colors.paper, borderRadius: 15, padding: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.line },
  ingredientIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  ingredientCopy: { flex: 1, minWidth: 0 },
  fridgeAction: { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  fridgeActionDone: { backgroundColor: colors.greenSoft },
  fridgeActionText: { color: colors.paper, fontSize: 10, fontWeight: '800' },
  fridgeActionDoneText: { color: colors.green },
  empty: { backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 25, alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(47,49,48,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 17, paddingBottom: 26 },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh, marginBottom: 13 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  filterLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 6 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: 12, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  optionActive: { backgroundColor: colors.orange },
  optionText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  optionTextActive: { color: colors.paper },
  sheetActions: { flexDirection: 'row', gap: 9, marginTop: 18 },
});
