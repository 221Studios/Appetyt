import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeVisual } from '../components/RecipeVisual';
import { Icon } from '../components/Icon';
import { creatorName } from '../recipePresentation';
import { ingredientIconName, presentShelfRecipe } from '../referenceLook';
import { colors, styles as common } from '../theme';

const OPTIONS = ['Jajka', 'Czosnek', 'Makaron', 'Boczek', 'Śmietanka', 'Masło', 'Pieczarki / Grzyby', 'Parmezan', 'Pomidory krojone', 'Oliwa z oliwek', 'Cebula', 'Szpinak', 'Tymianek'];

type Match = { recipe: RecipeSummary; matched: string[]; missing: string[] };

function looseMatch(ingredient: string, fridge: string[]) {
  const value = ingredient.toLocaleLowerCase();
  return fridge.some((item) => {
    const fridgeItem = item.toLocaleLowerCase();
    return value.includes(fridgeItem) || fridgeItem.includes(value) || value.split(' ')[0] === fridgeItem.split(' ')[0];
  });
}

export function FridgeScreen({ fridge, recipes, onAdd, onRemove, onOpen, onAddShopping }: { fridge: string[]; recipes: RecipeSummary[]; savedIds: string[]; onAdd: (name: string) => void; onRemove: (name: string) => void; onOpen: (id: string) => void; onToggleSaved: (id: string) => void; onAddShopping: (recipe: RecipeSummary) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(fridge);
  const [added, setAdded] = useState<string | null>(null);
  const matches = useMemo<Match[]>(() => recipes.map((recipe) => {
    const matched = recipe.ingredient_names.filter((ingredient) => looseMatch(ingredient, fridge));
    return { recipe: presentShelfRecipe(recipe), matched, missing: recipe.ingredient_names.filter((ingredient) => !matched.includes(ingredient)) };
  }).filter((item) => item.matched.length > 0).sort((a, b) => b.matched.length / Math.max(1, b.recipe.ingredient_count) - a.matched.length / Math.max(1, a.recipe.ingredient_count)).slice(0, 10), [fridge, recipes]);
  const visibleOptions = OPTIONS.filter((item) => item.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const openDrawer = () => { setDraft(fridge); setSearch(''); setDrawerOpen(true); };
  const addCustom = () => { const item = search.trim(); if (item && !draft.includes(item)) setDraft((current) => [...current, item]); setSearch(''); };
  const toggleDraft = (item: string) => setDraft((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const apply = () => { fridge.filter((item) => !draft.includes(item)).forEach(onRemove); draft.filter((item) => !fridge.includes(item)).forEach(onAdd); setDrawerOpen(false); };

  return <View style={common.screen}>
    <ScrollView style={common.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.summary}>
        <View style={styles.summaryRow}><View style={styles.summaryTitle}><View style={styles.greenDot} /><Text style={common.heading}>Twoja lodówka: <Text style={styles.orangeText}>{fridge.length} {fridge.length === 1 ? 'produkt' : fridge.length < 5 ? 'produkty' : 'produktów'}</Text></Text></View><Pressable onPress={openDrawer} style={styles.changeButton}><Icon name="edit" size={16} color={colors.orange} /><Text style={styles.changeText}>Zmień składniki</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{fridge.length ? fridge.map((item) => <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text><Pressable accessibilityLabel={`Usuń ${item} z lodówki`} onPress={() => onRemove(item)}><Icon name="close" size={14} color={colors.muted} /></Pressable></View>) : <Text style={common.muted}>Brak produktów. Kliknij „Zmień składniki”.</Text>}</ScrollView>
      </View>
      <View style={styles.note}><Icon name="info" size={18} color={colors.green} /><Text style={styles.noteText}>Zaznaczenie oznacza: masz produkt w domu. Sprawdź przed gotowaniem, czy starczy na pełne porcje.</Text></View>
      <View style={styles.feedHeader}><Text style={common.eyebrow}>DOPASOWANE PRZEPISY</Text><View style={styles.readyRow}><Icon name="bolt" size={16} color={colors.green} /><Text style={styles.ready}>{matches.length} gotowych inspiracji</Text></View></View>
      {matches.length === 0 ? <View style={styles.empty}><Icon name="kitchen" size={28} color={colors.orange} /><Text style={common.heading}>Za mało składników do dopasowania</Text><Text style={[common.muted, { textAlign: 'center', marginTop: 6 }]}>Dodaj makaron, jajka albo czosnek, żeby zobaczyć dania z Twojej lodówki.</Text></View> : matches.map(({ recipe, matched, missing }) => <MatchCard key={recipe.id} recipe={recipe} matched={matched} missing={missing} added={added === recipe.id} onOpen={onOpen} onAddShopping={() => { onAddShopping(recipe); setAdded(recipe.id); }} />)}
    </ScrollView>
    <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setDrawerOpen(false)}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeading}><View><Text style={common.heading}>Wybierz składniki z lodówki</Text><Text style={common.muted}>Zaznacz to, co masz obecnie w domu</Text></View><Pressable onPress={() => setDrawerOpen(false)}><Icon name="close" size={22} color={colors.muted} /></Pressable></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            <Pressable onPress={() => setDraft((current) => [...new Set([...current, 'Makaron', 'Czosnek', 'Jajka', 'Parmezan'])])} style={styles.preset}><Icon name="ramen-dining" size={16} color={colors.orange} /><Text style={styles.presetText}>Baza włoska</Text></Pressable>
            <Pressable onPress={() => setDraft((current) => [...new Set([...current, 'Jajka', 'Masło', 'Szpinak', 'Pomidory krojone'])])} style={styles.preset}><Icon name="free-breakfast" size={16} color={colors.orange} /><Text style={styles.presetText}>Śniadaniowa</Text></Pressable>
            <Pressable onPress={() => setDraft([])} style={styles.preset}><Icon name="delete-outline" size={16} color={colors.error} /><Text style={[styles.presetText, { color: colors.error }]}>Wyczyść</Text></Pressable>
          </ScrollView>
          <View style={styles.drawerSearch}><Icon name="search" size={20} color={colors.muted} /><TextInput accessibilityLabel="Szukaj składnika" value={search} onChangeText={setSearch} onSubmitEditing={addCustom} placeholder="Szukaj lub wpisz własny składnik..." placeholderTextColor={colors.muted} style={styles.drawerInput} /></View>
          {search.trim() && !OPTIONS.some((item) => item.toLocaleLowerCase() === search.trim().toLocaleLowerCase()) && <Pressable onPress={addCustom} style={styles.customAdd}><Icon name="add-circle" size={18} color={colors.orange} /><Text>Dodaj własny: „{search.trim()}”</Text></Pressable>}
          <ScrollView style={styles.optionList} showsVerticalScrollIndicator={false}>{visibleOptions.map((item) => <Pressable key={item} onPress={() => toggleDraft(item)} style={styles.optionRow}><View style={styles.optionIcon}><Icon name={ingredientIconName(item)} size={18} color={colors.orange} /></View><Text style={styles.optionName}>{item}</Text><View style={[styles.checkbox, draft.includes(item) && styles.checkboxActive]}>{draft.includes(item) ? <Icon name="check" size={16} color={colors.paper} /> : null}</View></Pressable>)}</ScrollView>
          <Pressable onPress={apply} style={common.button}><Text style={common.buttonText}>Zastosuj i przelicz dopasowanie ({draft.length})</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

function MatchCard({ recipe, matched, missing, added, onOpen, onAddShopping }: { recipe: RecipeSummary; matched: string[]; missing: string[]; added: boolean; onOpen: (id: string) => void; onAddShopping: () => void }) {
  const percent = Math.max(15, Math.round((matched.length / Math.max(1, recipe.ingredient_count)) * 100));
  const full = percent >= 95;
  return <View style={[styles.matchCard, full && styles.fullMatch]}>
    <Pressable onPress={() => onOpen(recipe.id)}>
      <View style={styles.matchTop}>
        <RecipeVisual recipe={recipe} height={82} style={styles.matchImage} />
        <View style={styles.matchCopy}>
          <View style={[styles.percent, full && styles.percentFull]}><Icon name={full ? 'verified' : 'auto-awesome'} size={13} color={full ? colors.green : colors.orange} /><Text style={[styles.percentText, full && styles.percentTextFull]}>{percent}% dopasowania</Text></View>
          <Text style={styles.matchTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={common.muted}>{creatorName(recipe)}</Text>
        </View>
      </View>
      <View style={styles.coverage}>
        <View style={styles.coverageHeader}><Text style={[styles.coverageText, full && styles.coverageGood]}>Masz {matched.length}/{recipe.ingredient_count} składników</Text><Text style={full ? styles.coverageGood : styles.coverageOrange}>{full ? 'Wszystko gotowe!' : `Brakuje: ${missing.length}`}</Text></View>
        <View style={styles.segmentBar}>{[0, 1, 2].map((segment) => <View key={segment} style={[styles.segment, percent >= (segment + 1) * 33 && (full ? styles.segmentGood : styles.segmentOrange)]} />)}</View>
        {missing.length ? <Text style={styles.missingLine}>Brakujące: <Text style={styles.missingStrong}>{missing.slice(0, 2).join(', ')}</Text></Text> : <Text style={styles.coverageGood}>Możesz od razu przystąpić do gotowania!</Text>}
      </View>
    </Pressable>
    {full ? <Pressable onPress={() => onOpen(recipe.id)} style={common.button}><Text style={common.buttonText}>Gotuj teraz</Text></Pressable> : <View style={styles.actionRow}><Pressable onPress={onAddShopping} style={[styles.addMissing, added && styles.addMissingDone]}><Icon name={added ? 'done' : 'add-shopping-cart'} size={16} color={colors.orange} /><Text style={styles.addMissingText}>{added ? 'Dodano do koszyka' : `Dodaj brakujące (${missing.length})`}</Text></Pressable><Pressable accessibilityLabel="Zobacz przepis" onPress={() => onOpen(recipe.id)} style={styles.chevron}><Icon name="chevron-right" size={22} color={colors.ink} /></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 105 },
  summary: { paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  summaryRow: { gap: 10 },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  orangeText: { color: colors.orange },
  changeButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 },
  changeText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  chips: { gap: 7, paddingTop: 10, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLow, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  chipText: { color: colors.ink, fontSize: 11 },
  note: { backgroundColor: colors.paper, borderRadius: 12, padding: 11, marginTop: 13, flexDirection: 'row', gap: 9, borderWidth: 1, borderColor: colors.line, alignItems: 'flex-start' },
  noteText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ready: { color: colors.green, fontSize: 11, fontWeight: '800' },
  empty: { backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 22, alignItems: 'center' },
  matchImage: { width: 94, borderRadius: 12 },
  matchCard: { backgroundColor: colors.paper, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 7, elevation: 1 },
  fullMatch: { borderColor: colors.green, borderWidth: 1.5 },
  matchTop: { flexDirection: 'row', gap: 11, minHeight: 82 },
  matchCopy: { flex: 1, justifyContent: 'center' },
  percent: { alignSelf: 'flex-start', backgroundColor: colors.orangeSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, marginBottom: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  percentFull: { backgroundColor: colors.greenPale },
  percentText: { color: colors.orange, fontSize: 10, fontWeight: '800' },
  percentTextFull: { color: colors.green },
  matchTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '800', marginBottom: 4 },
  coverage: { backgroundColor: colors.surfaceLow, borderRadius: 11, padding: 10, marginTop: 11, gap: 6 },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  coverageText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  coverageGood: { color: colors.green, fontSize: 11, fontWeight: '800' },
  coverageOrange: { color: colors.orange, fontSize: 11, fontWeight: '800' },
  segmentBar: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surfaceHigh },
  segmentGood: { backgroundColor: colors.green },
  segmentOrange: { backgroundColor: colors.orange },
  missingLine: { color: colors.muted, fontSize: 10 },
  missingStrong: { color: colors.ink, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 11 },
  addMissing: { flex: 1, backgroundColor: colors.surface, borderRadius: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44, flexDirection: 'row', gap: 6 },
  addMissingDone: { backgroundColor: colors.greenSoft },
  addMissingText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  chevron: { width: 44, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(47,49,48,0.55)' },
  sheet: { maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 17 },
  handle: { width: 48, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: colors.surfaceHigh, marginBottom: 13 },
  sheetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presetRow: { gap: 7, paddingVertical: 13 },
  preset: { backgroundColor: colors.surface, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  presetText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  drawerSearch: { height: 44, borderRadius: 11, backgroundColor: colors.surfaceLow, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 8, gap: 6 },
  drawerInput: { flex: 1, color: colors.ink, fontSize: 13 },
  customAdd: { backgroundColor: colors.orangeSoft, borderRadius: 10, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionList: { maxHeight: 280 },
  optionRow: { backgroundColor: colors.paper, borderRadius: 11, borderWidth: 1, borderColor: colors.line, padding: 10, marginBottom: 7, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  optionName: { flex: 1, color: colors.ink, fontSize: 14 },
  checkbox: { width: 23, height: 23, borderRadius: 7, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.green },
});
