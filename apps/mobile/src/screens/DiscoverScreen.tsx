import { ScrollView, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { colors, styles } from '../theme';

export function DiscoverScreen({ recipes, savedIds, onOpen, onToggleSaved }: { recipes: RecipeSummary[]; savedIds: string[]; onOpen: (id: string) => void; onToggleSaved: (id: string) => void }) {
  const categories = [...new Set(recipes.map((recipe) => recipe.category))];
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>Dzień dobry</Text>
    <Text style={[styles.title, { marginTop: 4, marginBottom: 8 }]}>Co dziś ugotujesz?</Text>
    <Text style={[styles.muted, { marginBottom: 22 }]}>Odkrywaj sprawdzone pomysły i gotuj bez zgadywania.</Text>
    <View style={styles.card}><Text style={styles.eyebrow}>Dopasowane do lodówki</Text><Text style={styles.heading}>Wykorzystaj to, co już masz</Text><Text style={styles.muted}>Dodaj składniki w zakładce Lodówka, a pokażemy pasujące przepisy.</Text></View>
    <Text style={styles.heading}>Kategorie</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>{categories.map((category) => <View key={category} style={{ backgroundColor: colors.greenSoft, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9, marginRight: 8 }}><Text style={{ color: colors.green, fontWeight: '700' }}>{category}</Text></View>)}</ScrollView>
    <Text style={styles.heading}>MVP — pięć przepisów testowych</Text>
    {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={savedIds.includes(recipe.id)} onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} />)}
  </ScrollView>;
}
