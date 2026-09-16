import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { tap } from '../haptics';
import { creatorName, recipePrice } from '../recipePresentation';
import { colors, fonts } from '../theme';
import { BookmarkIcon } from './Icon';
import { RecipeVisual } from './RecipeVisual';

export function RecipeCard({ recipe, saved, onPress, onToggleSaved, matchLabel }: { recipe: RecipeSummary; saved: boolean; onPress: () => void; onToggleSaved: () => void; matchLabel?: string }) {
  const calories = recipe.nutrition_per_serving.calories;
  const calorieLabel = calories === null ? '' : `  ·  ${Math.round(calories)} kcal`;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz przepis ${recipe.title}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <RecipeVisual recipe={recipe} height={98} style={styles.image} />
    <View style={styles.body}>
      <View style={styles.headingRow}>
        <View style={styles.copy}>
          <Text style={styles.author} numberOfLines={1}>{creatorName(recipe)}</Text>
          <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Usuń z zapisanych' : 'Zapisz przepis'} hitSlop={8} onPress={() => { tap(); onToggleSaved(); }} style={styles.save}>
          <BookmarkIcon saved={saved} />
        </Pressable>
      </View>
      <Text style={styles.meta} numberOfLines={1}>{recipe.duration_minutes} min  ·  {recipePrice(recipe)}{calorieLabel}</Text>
      {matchLabel && <View style={styles.match}><Text style={styles.matchText}>{matchLabel}</Text></View>}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: '#e8e8e7', overflow: 'hidden', marginBottom: 12, flexDirection: 'row', minHeight: 122, shadowColor: '#1a1c1c', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  image: { width: 106, height: '100%', minHeight: 122, borderRadius: 0 },
  body: { flex: 1, padding: 12, justifyContent: 'center', minWidth: 0 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  copy: { flex: 1, minWidth: 0 },
  author: { color: colors.orange, fontSize: 10, lineHeight: 14, fontFamily: fonts.bodyBold },
  title: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: fonts.headline, marginTop: 2 },
  save: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginTop: -7, marginRight: -6 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 8, fontFamily: fonts.bodyRegular },
  match: { alignSelf: 'flex-start', backgroundColor: colors.greenPale, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, marginTop: 7 },
  matchText: { color: colors.green, fontSize: 10, fontFamily: fonts.bodyBold },
});
