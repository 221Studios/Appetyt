import { ScrollView, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { RecipeCard } from '../components/RecipeCard';
import { styles } from '../theme';

export function SavedScreen({ recipes, savedIds, onOpen, onToggleSaved }: { recipes: RecipeSummary[]; savedIds: string[]; onOpen: (id: string) => void; onToggleSaved: (id: string) => void }) {
  const saved = recipes.filter((recipe) => savedIds.includes(recipe.id));
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>Twoje przepisy</Text><Text style={[styles.title, { marginTop: 4, marginBottom: 18 }]}>Zapisane</Text>{saved.length === 0 ? <View style={styles.card}><Text style={styles.heading}>Jeszcze nic tu nie ma</Text><Text style={styles.muted}>Dotknij serca przy przepisie, aby zapisać go na urządzeniu.</Text></View> : saved.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved onPress={() => onOpen(recipe.id)} onToggleSaved={() => onToggleSaved(recipe.id)} />)}</ScrollView>;
}
