import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeVisual } from '../components/RecipeVisual';
import { BookmarkIcon, Icon } from '../components/Icon';
import { REFERENCE_CATEGORIES, REFERENCE_CHEFS, SearchSeed, pickDiscoverShelf, presentShelfRecipe, recipeMatchesCategory, seedForCategory } from '../referenceLook';
import { tap } from '../haptics';
import { creatorName, creatorSource, recipePrice } from '../recipePresentation';
import { colors, fonts, styles as common } from '../theme';

export function DiscoverScreen({ recipes, savedIds, fridge, following, onOpen, onToggleSaved, onNavigate, onAddShopping, onOpenChef }: { recipes: RecipeSummary[]; savedIds: string[]; fridge: string[]; following: string[]; onOpen: (id: string) => void; onToggleSaved: (id: string) => void; onNavigate: (tab: 'search' | 'fridge' | 'shopping', seed?: SearchSeed) => void; onAddShopping: (recipe: RecipeSummary) => void; onOpenChef: (chefId: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState(REFERENCE_CATEGORIES[0].label);
  const [historyCleared, setHistoryCleared] = useState(false);
  const { featured, forYou, matched } = useMemo(() => pickDiscoverShelf(recipes, fridge), [recipes, fridge]);
  const categoryRecipes = useMemo(() => recipes.filter((recipe) => recipeMatchesCategory(recipe, selectedCategory)).map(presentShelfRecipe).slice(0, 6), [recipes, selectedCategory]);
  if (!featured) return <ScrollView style={common.screen} contentContainerStyle={common.content}><Text style={common.heading}>Brak przepisów</Text><Text style={common.muted}>Uruchom API, aby załadować katalog.</Text></ScrollView>;

  return <ScrollView style={common.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Szukaj dań, składników i szefów" onPress={() => onNavigate('search')} style={styles.searchBar}>
      <Icon name="search" size={22} color={colors.orange} />
      <Text style={styles.searchPlaceholder}>Szukaj dań, składników, szefów...</Text>
      <View style={styles.filterIcon}><Icon name="tune" size={16} color={colors.muted} /></View>
    </Pressable>

    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}><Icon name="local-fire-department" size={18} color={colors.orange} /><Text style={common.heading}>Wybór Tygodnia</Text></View>
      <Text style={styles.accentLabel}>POLECANE</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz ${featured.title}`} onPress={() => onOpen(featured.id)} style={styles.hero}>
      <RecipeVisual recipe={featured} height={210} style={styles.heroImage} />
      <View style={styles.heroScrim} />
      <View style={styles.heroTop}>
        <View style={styles.sourcePill}><Icon name="verified" size={14} color={colors.green} /><Text style={styles.sourceText}>Źródło: {creatorSource(featured)}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Zapisz przepis" hitSlop={8} onPress={() => onToggleSaved(featured.id)} style={styles.heroSave}><BookmarkIcon saved={savedIds.includes(featured.id)} /></Pressable>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroAuthor}>Szef {creatorName(featured)}</Text>
        <Text style={styles.heroTitle} numberOfLines={2}>{featured.title}</Text>
        <View style={styles.statRow}>
          <Stat icon="timer" label={`${featured.duration_minutes} min`} />
          <Stat icon="local-fire-department" label={featured.nutrition_per_serving.calories !== null ? `${Math.round(featured.nutrition_per_serving.calories)} kcal` : 'kcal: brak w źródle'} />
          <Stat icon="payments" label={`${recipePrice(featured)} · orientacyjnie`} />
        </View>
      </View>
    </Pressable>

    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
      <View><Text style={common.heading}>Dla Ciebie</Text><Text style={common.muted}>Dopasowane do Twojego stylu gotowania</Text></View>
      <Pressable onPress={() => onNavigate('search')}><Text style={styles.link}>Zobacz</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {forYou.map((recipe) => <Pressable key={recipe.id} accessibilityRole="button" accessibilityLabel={`Otwórz ${recipe.title}`} onPress={() => onOpen(recipe.id)} style={styles.railCard}>
        <View>
          <RecipeVisual recipe={recipe} height={118} style={styles.railImage} />
          <Pressable accessibilityRole="button" accessibilityLabel={savedIds.includes(recipe.id) ? 'Usuń z zapisanych' : `Zapisz ${recipe.title}`} onPress={() => onToggleSaved(recipe.id)} style={styles.railSave}><BookmarkIcon saved={savedIds.includes(recipe.id)} size={18} /></Pressable>
        </View>
        <View style={styles.railBody}>
          <Text style={styles.railAuthor} numberOfLines={1}>{creatorName(recipe)}</Text>
          <Text style={styles.railTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.railMetaRow}>
            <View style={styles.miniChip}><Icon name="schedule" size={13} color={colors.orange} /><Text style={styles.miniChipText}>{recipe.duration_minutes} min</Text></View>
            <View style={styles.miniChip}><Icon name="payments" size={13} color={colors.green} /><Text style={styles.miniChipText}>{recipePrice(recipe)}</Text></View>
          </View>
        </View>
      </Pressable>)}
    </ScrollView>

    <View style={[styles.sectionHeader, { marginTop: 22 }]}><Text style={common.heading}>Kategorie</Text><Text style={common.muted}>Przeglądaj</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {REFERENCE_CATEGORIES.map((category) => {
    const selected = selectedCategory === category.label;
        return <Pressable key={category.label} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { tap(); setSelectedCategory(category.label); onNavigate('search', seedForCategory(category.label)); }} style={[styles.categoryChip, selected && styles.categoryChipActive]}>
          <Icon name={category.icon} size={16} color={selected ? colors.paper : colors.ink} />
          <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
    {categoryRecipes.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {categoryRecipes.map((recipe) => <Pressable key={recipe.id} onPress={() => { tap(); onOpen(recipe.id); }} style={styles.railCard}>
        <RecipeVisual recipe={recipe} height={118} style={styles.railImage} />
        <View style={styles.railBody}>
          <Text style={styles.railTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={common.muted}>{recipe.duration_minutes} min · {recipePrice(recipe)}</Text>
        </View>
      </Pressable>)}
    </ScrollView>}

    <Text style={[common.heading, { marginTop: 24 }]}>Szefowie, których warto znać</Text>
    <Text style={common.muted}>Sprawdzone przepisy od zaufanych twórców</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chefs}>
      {REFERENCE_CHEFS.map((chef, index) => <Pressable key={chef.id} onPress={() => { tap(); onOpenChef(chef.id); }} style={styles.chef}>
        <View style={[styles.avatarRing, (index === 0 || following.includes(chef.id)) && styles.avatarActive]}>
          <Image source={{ uri: chef.avatarUrl }} style={styles.avatar} />
        </View>
        <Text style={styles.chefName} numberOfLines={1}>{chef.shortName}</Text>
        <Text style={styles.chefCount}>{chef.recipesCount} dań</Text>
      </Pressable>)}
    </ScrollView>

    {matched && <>
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.kitchenIcon}><Icon name="kitchen" size={18} color={colors.green} /></View>
          <View><Text style={common.heading}>Z Twojej lodówki</Text><Text style={styles.greenLabel}>Dopasowano do {fridge.length || 4} składników</Text></View>
        </View>
        <Pressable onPress={() => onNavigate('fridge')}><Text style={styles.link}>Otwórz</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz ${matched.title}`} onPress={() => onOpen(matched.id)} style={styles.matchCard}>
        <View style={styles.matchRow}>
          <RecipeVisual recipe={matched} height={96} style={styles.matchImage} />
          <View style={styles.matchCopy}>
            <Text style={styles.matchKicker}>Obiad w {matched.duration_minutes} min</Text>
            <Text style={styles.matchTitle} numberOfLines={2}>{matched.title}</Text>
            <View style={styles.coverage}><Text style={styles.coverageText}>Masz składniki w domu</Text><Text style={styles.missing}>Orientacyjnie</Text></View>
            <View style={styles.coverageBar}><View style={[styles.coverageFill, { width: `${fridge.length ? 70 : 25}%` }]} /></View>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => { onAddShopping(matched); onNavigate('shopping'); }} style={styles.missingAction}>
          <View style={styles.missingActionLeft}><Icon name="shopping-basket" size={16} color={colors.muted} /><Text style={styles.missingActionText}>Dodaj brakujące do listy</Text></View>
          <Text style={styles.link}>Dodaj</Text>
        </Pressable>
      </Pressable>
    </>}

    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
      <View style={styles.sectionTitleRow}><Icon name="history" size={20} color={colors.muted} /><Text style={common.heading}>Ostatnio oglądane</Text></View>
      {!historyCleared && <Pressable onPress={() => setHistoryCleared(true)}><Text style={common.muted}>Wyczyść</Text></Pressable>}
    </View>
    {historyCleared
      ? <View style={styles.historyEmpty}><Icon name="check-circle" size={23} color={colors.green} /><Text style={common.muted}>Historia została wyczyszczona</Text></View>
      : forYou.slice(0, 2).map((recipe) => <Pressable key={recipe.id} onPress={() => onOpen(recipe.id)} style={styles.historyRow}>
        <RecipeVisual recipe={recipe} height={48} style={styles.historyImage} />
        <View style={styles.historyCopy}><Text style={styles.historyTitle} numberOfLines={1}>{recipe.title}</Text><Text style={common.muted}>{recipe.duration_minutes} min  ·  {recipePrice(recipe)}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Zapisz do zakładek" onPress={() => onToggleSaved(recipe.id)}><BookmarkIcon saved={savedIds.includes(recipe.id)} /></Pressable>
      </Pressable>)}
  </ScrollView>;
}

function Stat({ icon, label }: { icon: 'timer' | 'local-fire-department' | 'payments'; label: string }) {
  return <View style={styles.stat}><Icon name={icon} size={14} color={colors.orangeSoft} /><Text style={styles.statText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 108 },
  searchBar: { height: 48, marginBottom: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.paper, borderWidth: 1, borderColor: 'rgba(232,232,231,0.3)', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#1a1c1c', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  searchPlaceholder: { flex: 1, color: colors.muted, fontSize: 14, fontFamily: fonts.bodyRegular },
  filterIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accentLabel: { color: colors.orange, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.1 },
  hero: { height: 210, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: colors.surfaceHigh },
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 0 },
  heroScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(47,49,48,0.45)' },
  heroTop: { position: 'absolute', left: 16, right: 16, top: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourcePill: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { color: colors.ink, fontSize: 11, fontFamily: fonts.body },
  heroSave: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  heroAuthor: { color: colors.orangeSoft, fontSize: 12, fontFamily: fonts.bodyBold, marginBottom: 2 },
  heroTitle: { color: colors.paper, fontSize: 20, lineHeight: 26, fontFamily: fonts.headline, marginBottom: 8 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stat: { backgroundColor: 'rgba(47,49,48,0.8)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.paper, fontSize: 11, fontFamily: fonts.body },
  link: { color: colors.orange, fontSize: 13, fontFamily: fonts.bodyBold },
  rail: { gap: 14, paddingBottom: 3 },
  railCard: { width: 260, backgroundColor: colors.paper, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(232,232,231,0.3)' },
  railImage: { borderRadius: 0 },
  railSave: { position: 'absolute', right: 10, top: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  railBody: { padding: 14, gap: 4 },
  railAuthor: { color: colors.orange, fontSize: 11, fontFamily: fonts.bodyBold },
  railTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: fonts.headline, minHeight: 42 },
  railMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  miniChip: { backgroundColor: colors.surfaceLow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniChipText: { color: colors.ink, fontSize: 11, fontFamily: fonts.body },
  chips: { gap: 8, paddingBottom: 3 },
  categoryChip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.paper, borderWidth: 1, borderColor: 'rgba(226,226,224,0.4)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  categoryText: { color: colors.ink, fontSize: 13, fontFamily: fonts.body },
  categoryTextActive: { color: colors.paper, fontFamily: fonts.bodyBold },
  chefs: { gap: 16, paddingVertical: 8 },
  chef: { width: 80, alignItems: 'center' },
  avatarRing: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: colors.surfaceHigh, marginBottom: 6 },
  avatarActive: { backgroundColor: colors.orange },
  avatar: { width: '100%', height: '100%', borderRadius: 30 },
  chefName: { color: colors.ink, fontSize: 12, fontFamily: fonts.bodyBold, textAlign: 'center' },
  chefCount: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: fonts.bodyRegular },
  kitchenIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  greenLabel: { color: colors.green, fontSize: 11, fontFamily: fonts.bodyBold, marginTop: 2 },
  matchCard: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(232,232,231,0.4)' },
  matchRow: { flexDirection: 'row', gap: 14 },
  matchImage: { width: 96, borderRadius: 12 },
  matchCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  matchKicker: { color: colors.muted, fontSize: 11, fontFamily: fonts.bodyRegular },
  matchTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: fonts.headline, marginTop: 3 },
  coverage: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  coverageText: { color: colors.green, fontSize: 11, fontFamily: fonts.bodyBold },
  missing: { color: colors.orange, fontSize: 11, fontFamily: fonts.body },
  coverageBar: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceHigh, marginTop: 6 },
  coverageFill: { height: 6, borderRadius: 3, backgroundColor: colors.green },
  missingAction: { backgroundColor: colors.surfaceLow, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9, marginTop: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missingActionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  missingActionText: { color: colors.muted, fontSize: 11, fontFamily: fonts.bodyBold },
  historyRow: { backgroundColor: colors.paper, borderRadius: 13, padding: 9, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e8e8e7' },
  historyImage: { width: 48, borderRadius: 9 },
  historyCopy: { flex: 1, minWidth: 0 },
  historyTitle: { color: colors.ink, fontSize: 13, fontFamily: fonts.bodyBold },
  historyEmpty: { backgroundColor: colors.surfaceLow, borderRadius: 13, alignItems: 'center', padding: 18, gap: 6 },
});
