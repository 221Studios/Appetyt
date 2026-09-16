import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';

import { api } from './api/client';
import { RecipeDetail, RecipeSummary } from './api/types';
import { BottomTabs, Tab } from './components/BottomTabs';
import { CookingScreen } from './screens/CookingScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { FridgeScreen } from './screens/FridgeScreen';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { SavedScreen } from './screens/SavedScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ShoppingScreen } from './screens/ShoppingScreen';
import { findMissingIngredients } from './ingredientMatching';
import { createRecipeLoader } from './recipeLoader';
import { useLocalState } from './state/useLocalState';
import { ShoppingItem } from './state/localState';
import { colors, styles } from './theme';

export default function App() {
  const { state, dispatch, hydrated, persistenceError } = useLocalState();
  const [tab, setTab] = useState<Tab>('discover');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<RecipeDetail | null>(null);
  const [apiError, setApiError] = useState(false);
  const loadRecipes = useMemo(
    () => createRecipeLoader(api.getRecipes, (items) => { setRecipes(items); setApiError(false); }, () => setApiError(true)),
    [],
  );
  useEffect(() => { void loadRecipes(); }, [loadRecipes]);
  const savedIds = state.savedRecipeIds;
  const selectedRecipe = useMemo(() => recipes.find((recipe) => recipe.id === recipeId), [recipes, recipeId]);
  const addMissingToShopping = (recipe: RecipeDetail) => {
    const additions: ShoppingItem[] = findMissingIngredients(recipe.ingredients, state.fridge).map((ingredient) => ({ id: `${recipe.id}-${ingredient.ingredient_id ?? ingredient.name}`, title: `${ingredient.name} · ${ingredient.amount_text}`, recipeTitle: recipe.title, isBought: false }));
    additions.forEach((item) => { if (!state.shopping.some((existing) => existing.id === item.id)) dispatch({ type: 'addShopping', item }); });
    setRecipeId(null); setTab('shopping');
  };
  if (!hydrated) return <SafeAreaView style={styles.screen}><ActivityIndicator color={colors.orange} style={{ marginTop: 100 }} /></SafeAreaView>;
  if (cookingRecipe) return <><StatusBar style="dark" /><SafeAreaView style={styles.screen}><PersistenceNotice visible={persistenceError} /><CookingScreen recipe={cookingRecipe} onClose={() => setCookingRecipe(null)} /></SafeAreaView></>;
  if (recipeId && selectedRecipe) return <><StatusBar style="dark" /><SafeAreaView style={styles.screen}><PersistenceNotice visible={persistenceError} /><RecipeDetailScreen recipeId={recipeId} saved={savedIds.includes(recipeId)} onBack={() => setRecipeId(null)} onToggleSaved={() => dispatch({ type: 'toggleSaved', recipeId })} onStartCooking={setCookingRecipe} onAddShopping={addMissingToShopping} /></SafeAreaView></>;
  const common = { recipes, savedIds, onOpen: setRecipeId, onToggleSaved: (id: string) => dispatch({ type: 'toggleSaved', recipeId: id }) };
  return <SafeAreaView style={styles.screen}><StatusBar style="dark" /><View style={{ flex: 1 }}><PersistenceNotice visible={persistenceError} />{apiError && <View style={{ backgroundColor: colors.orangeSoft, padding: 9 }}><Text style={{ color: colors.orange, textAlign: 'center', fontSize: 12 }}>API niedostępne — uruchom Docker Compose i spróbuj ponownie.</Text><Pressable accessibilityRole="button" accessibilityLabel="Spróbuj ponownie" onPress={() => void loadRecipes()}><Text style={{ color: colors.orange, textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Spróbuj ponownie</Text></Pressable></View>}{tab === 'discover' && <DiscoverScreen {...common} />}{tab === 'search' && <SearchScreen {...common} onAddFridge={(name) => dispatch({ type: 'addFridge', ingredient: name })} />}{tab === 'fridge' && <FridgeScreen {...common} fridge={state.fridge} onAdd={(name) => dispatch({ type: 'addFridge', ingredient: name })} onRemove={(name) => dispatch({ type: 'removeFridge', ingredient: name })} />}{tab === 'shopping' && <ShoppingScreen items={state.shopping} onAdd={(title) => dispatch({ type: 'addShopping', item: { id: `manual-${Date.now()}`, title, isBought: false } })} onToggle={(id) => dispatch({ type: 'toggleBought', itemId: id })} onClear={() => dispatch({ type: 'removeBought' })} />}{tab === 'saved' && <SavedScreen {...common} />}<BottomTabs active={tab} shoppingCount={state.shopping.filter((item) => !item.isBought).length} onChange={setTab} /></View></SafeAreaView>;
}

function PersistenceNotice({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={{ backgroundColor: colors.orangeSoft, padding: 9 }}><Text style={{ color: colors.orange, textAlign: 'center', fontSize: 12 }}>Nie udało się zapisać zmian na urządzeniu. Mogą zniknąć po ponownym uruchomieniu.</Text></View>;
}
