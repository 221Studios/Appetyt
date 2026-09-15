import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { colors, styles as common } from '../theme';

export function RecipeCard({ recipe, saved, onPress, onToggleSaved }: { recipe: RecipeSummary; saved: boolean; onPress: () => void; onToggleSaved: () => void }) {
  const nutrition = recipe.nutrition_per_serving;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz przepis ${recipe.title}`} style={common.card} onPress={onPress}>
      <View style={styles.hero}><Text style={styles.heroEmoji}>🍲</Text><Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Usuń z zapisanych' : 'Zapisz przepis'} style={styles.save} onPress={onToggleSaved}><Text style={styles.saveText}>{saved ? '♥' : '♡'}</Text></Pressable></View>
      <Text style={common.eyebrow}>{recipe.category} · {recipe.duration_minutes} min</Text>
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.subtitle && <Text style={common.muted}>{recipe.subtitle}</Text>}
      <View style={styles.meta}><Text style={common.muted}>{nutrition.calories ?? '—'} kcal / porcja</Text><Text style={common.muted}>{recipe.servings} porcje</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { height: 108, borderRadius: 14, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroEmoji: { fontSize: 54 },
  save: { position: 'absolute', right: 10, top: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.orange, fontSize: 23 },
  title: { color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: 5, marginBottom: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
