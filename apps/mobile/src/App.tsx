import { Epilogue_700Bold, Epilogue_800ExtraBold, useFonts } from '@expo-google-fonts/epilogue';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { api } from './api/client';
import { RecipeDetail, RecipeSummary } from './api/types';
import { BottomTabs, Tab } from './components/BottomTabs';
import { ChefModal } from './components/ChefModal';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { notifyTap, tap } from './haptics';
import { REFERENCE_CHEFS, SearchSeed } from './referenceLook';
import { createRecipeLoader } from './recipeLoader';
import { CookingScreen } from './screens/CookingScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { FridgeScreen } from './screens/FridgeScreen';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { SavedScreen } from './screens/SavedScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ShoppingScreen } from './screens/ShoppingScreen';
import { formatTimer, useCookingSession } from './state/useCookingSession';
import { useLocalState } from './state/useLocalState';
import { applyLoyalty, shoppingItemsFromRecipe } from './storePrices';
import { colors, fonts, styles as baseStyles } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({ Epilogue_700Bold, Epilogue_800ExtraBold, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold });
  const { state, dispatch, hydrated, persistenceError } = useLocalState();
  const cooking = useCookingSession();
  const [tab, setTab] = useState<Tab>('discover');
  const [searchSeed, setSearchSeed] = useState<SearchSeed | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [chefId, setChefId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const loadRecipes = useMemo(() => createRecipeLoader(api.getRecipes, (items, total) => { setRecipes(items); setCatalogTotal(total); setApiError(false); }, () => setApiError(true)), []);
  useEffect(() => { void loadRecipes(); }, [loadRecipes]);
  useEffect(() => {
    if (cooking.recipe && cooking.seconds === 0 && cooking.running && state.settings.timerSound) notifyTap();
  }, [cooking.recipe, cooking.seconds, cooking.running, state.settings.timerSound]);

  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast((current) => current === message ? null : current), 2600); };
  const selectedChef = REFERENCE_CHEFS.find((chef) => chef.id === chefId) ?? null;
  const goTab = (next: Tab, seed?: SearchSeed) => {
    setTab(next);
    setRecipeId(null);
    setSearchSeed(next === 'search' ? seed ?? null : null);
  };
  const addSummaryToShopping = (recipe: RecipeSummary) => {
    void api.getRecipe(recipe.id).then((detail) => addDetailToShopping(detail)).catch(() => showToast('Nie udało się pobrać cen sklepów dla tego przepisu'));
  };
  const addDetailToShopping = (recipe: RecipeDetail) => {
    const items = shoppingItemsFromRecipe(recipe, state.fridge, state.settings.discounts);
    items.forEach((item) => dispatch({ type: 'addShopping', item }));
    const priced = items.filter((item) => item.price != null).length;
    showToast(items.length ? `Dodano ${items.length} składników · ${priced} z ceną sklepową` : 'Masz już wszystkie składniki');
    goTab('shopping');
  };
  const finishCooking = (completed: boolean) => {
    cooking.finish();
    if (completed) {
      dispatch({ type: 'incrementCooked' });
      showToast('Gotowanie zakończone. Smacznego!');
    } else {
      showToast('Zakończono aktywne gotowanie');
    }
  };
  const common = {
    recipes,
    savedIds: state.savedRecipeIds,
    onOpen: setRecipeId,
    onToggleSaved: (id: string) => dispatch({ type: 'toggleSaved', recipeId: id }),
  };
  if (!fontsLoaded || !hydrated) {
    return <SafeAreaProvider><SafeAreaView style={baseStyles.screen}><ActivityIndicator color={colors.orange} style={{ marginTop: 120 }} /></SafeAreaView></SafeAreaProvider>;
  }
  if (cooking.modalOpen && cooking.recipe) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={baseStyles.screen}>
          <StatusBar style="dark" />
          <CookingScreen
            recipe={cooking.recipe}
            index={cooking.index}
            seconds={cooking.seconds}
            running={cooking.running}
            onClose={() => cooking.setModalOpen(false)}
            onPrevious={() => cooking.goTo(cooking.index - 1)}
            onNext={() => {
              if (!cooking.recipe || cooking.index >= cooking.recipe.steps.length - 1) finishCooking(true);
              else cooking.goTo(cooking.index + 1);
            }}
            onToggleRun={() => cooking.setRunning((value) => !value)}
            onAdjustSeconds={cooking.setSeconds}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  if (recipeId) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={baseStyles.screen}>
          <StatusBar style="dark" />
          <RecipeDetailScreen
            recipeId={recipeId}
            fridge={state.fridge}
            saved={state.savedRecipeIds.includes(recipeId)}
            discounts={state.settings.discounts}
            onBack={() => setRecipeId(null)}
            onToggleSaved={() => dispatch({ type: 'toggleSaved', recipeId })}
            onStartCooking={cooking.start}
            onAddShopping={addDetailToShopping}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={baseStyles.screen}>
        <StatusBar style="dark" />
        <View style={styles.app}>
          <Header onHome={() => goTab('discover')} onSettings={() => setSettingsOpen(true)} onProfile={() => setProfileOpen(true)} />
          <View style={styles.content}>
            {persistenceError && <Notice text="Nie udało się zapisać zmian na urządzeniu." />}
            {apiError && (
              <View style={styles.error}>
                <Text style={styles.errorText}>API niedostępne — nie udało się wczytać katalogu.</Text>
                <Pressable onPress={() => void loadRecipes()}><Text style={styles.retry}>Spróbuj ponownie</Text></Pressable>
              </View>
            )}
            {tab === 'discover' && (
              <DiscoverScreen
                {...common}
                fridge={state.fridge}
                following={state.followingChefIds}
                onNavigate={goTab}
                onAddShopping={addSummaryToShopping}
                onOpenChef={setChefId}
              />
            )}
            {tab === 'search' && (
              <SearchScreen
                {...common}
                fridge={state.fridge}
                following={state.followingChefIds}
                seed={searchSeed}
                catalogTotal={catalogTotal}
                onAddFridge={(name) => dispatch({ type: 'addFridge', ingredient: name })}
                onToggleFollow={(id) => dispatch({ type: 'toggleFollow', chefId: id })}
                onOpenChef={setChefId}
              />
            )}
            {tab === 'fridge' && (
              <FridgeScreen
                {...common}
                fridge={state.fridge}
                onAdd={(name) => dispatch({ type: 'addFridge', ingredient: name })}
                onRemove={(name) => dispatch({ type: 'removeFridge', ingredient: name })}
                onAddShopping={addSummaryToShopping}
              />
            )}
            {tab === 'shopping' && (
              <ShoppingScreen
                items={state.shopping}
                onAdd={(title) => {
                  void api.cheapestProduct(title).then((hit) => {
                    dispatch({
                      type: 'addShopping',
                      item: {
                        id: `manual-${Date.now()}`,
                        title,
                        subtitle: hit ? `${hit.name} · orientacyjnie` : 'Brak ceny w katalogu sklepów',
                        price: hit ? applyLoyalty(hit.price, state.settings.discounts) : undefined,
                        storeName: hit?.store,
                        group: 'custom',
                        groupTitle: 'Inne / Dodane ręcznie',
                        isBought: false,
                      },
                    });
                  });
                }}
                onToggle={(id) => dispatch({ type: 'toggleBought', itemId: id })}
                onClear={() => dispatch({ type: 'removeBought' })}
                onDelete={(id) => dispatch({ type: 'removeShopping', itemId: id })}
                onSetPrice={(id, price, store) => dispatch({ type: 'setShoppingPrice', itemId: id, price, store })}
              />
            )}
            {tab === 'saved' && <SavedScreen {...common} onExplore={() => goTab('discover')} />}
          </View>
          <BottomTabs active={tab} shoppingCount={state.shopping.filter((item) => !item.isBought).length} onChange={(next) => goTab(next)} />
          {cooking.recipe && (
            <CookingWidget
              step={cooking.index + 1}
              total={cooking.recipe.steps.length}
              timer={formatTimer(cooking.seconds)}
              title={cooking.recipe.steps[cooking.index]?.title ?? cooking.recipe.title}
              running={cooking.running}
              onOpen={() => cooking.setModalOpen(true)}
              onToggleRun={() => cooking.setRunning((value) => !value)}
              onStop={() => finishCooking(false)}
            />
          )}
        </View>
        {selectedChef && (
          <ChefModal
            chef={selectedChef}
            recipes={recipes}
            following={state.followingChefIds.includes(selectedChef.id)}
            onToggleFollow={() => dispatch({ type: 'toggleFollow', chefId: selectedChef.id })}
            onOpenRecipe={(id) => { setChefId(null); setRecipeId(id); }}
            onClose={() => setChefId(null)}
          />
        )}
        <ProfileModal
          visible={profileOpen}
          profile={state.profile}
          onClose={() => setProfileOpen(false)}
          savedCount={state.savedRecipeIds.length}
          fridgeCount={state.fridge.length}
          onSave={(profile) => { dispatch({ type: 'setProfile', profile }); setProfileOpen(false); showToast('Zapisano profil kucharza'); }}
        />
        <SettingsModal
          visible={settingsOpen}
          settings={state.settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(settings) => { dispatch({ type: 'setSettings', settings }); setSettingsOpen(false); showToast('Zapisano ustawienia'); }}
        />
        {toast && <View style={styles.toast}><Icon name="info" size={16} color={colors.orange} /><Text style={styles.toastText}>{toast}</Text></View>}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Notice({ text }: { text: string }) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{text}</Text></View>;
}

function CookingWidget({
  step,
  total,
  timer,
  title,
  running,
  onOpen,
  onToggleRun,
  onStop,
}: {
  step: number;
  total: number;
  timer: string;
  title: string;
  running: boolean;
  onOpen: () => void;
  onToggleRun: () => void;
  onStop: () => void;
}) {
  return (
    <View style={styles.widget}>
      <Pressable onPress={onOpen} style={styles.widgetOpen}>
        <View style={styles.widgetIcon}><Icon name="restaurant" size={20} color={colors.paper} /></View>
        <View style={styles.widgetCopy}>
          <Text style={styles.widgetKicker}>KROK {step}/{total}  ·  {timer}</Text>
          <Text style={styles.widgetTitle} numberOfLines={1}>{title}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityLabel={running ? 'Pauza' : 'Wznów'} onPress={() => { tap(); onToggleRun(); }} style={styles.widgetClose}>
        <Icon name={running ? 'pause' : 'play-arrow'} size={20} color={colors.inverseText} />
      </Pressable>
      <Pressable accessibilityLabel="Zakończ gotowanie" onPress={onStop} style={styles.widgetClose}>
        <Icon name="close" size={20} color={colors.inverseText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ...baseStyles,
  app: { flex: 1 },
  content: { flex: 1 },
  error: { backgroundColor: colors.orangeSoft, padding: 8, alignItems: 'center' },
  errorText: { color: colors.orange, fontSize: 11, fontFamily: fonts.body },
  retry: { color: colors.orange, fontSize: 11, fontFamily: fonts.bodyBold, marginTop: 3 },
  notice: { backgroundColor: colors.orangeSoft, padding: 8, alignItems: 'center' },
  noticeText: { color: colors.orange, fontSize: 11, fontFamily: fonts.body },
  toast: { position: 'absolute', top: 76, alignSelf: 'center', maxWidth: '90%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.inverse, flexDirection: 'row', alignItems: 'center', gap: 7, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4, zIndex: 20 },
  toastText: { color: colors.inverseText, fontSize: 12, fontFamily: fonts.bodyBold },
  widget: { position: 'absolute', left: 12, right: 12, bottom: 80, minHeight: 63, borderRadius: 16, padding: 8, backgroundColor: colors.inverse, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 12, elevation: 7 },
  widgetOpen: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  widgetIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  widgetCopy: { flex: 1, minWidth: 0 },
  widgetKicker: { color: colors.orangeSoft, fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
  widgetTitle: { color: colors.inverseText, fontSize: 12, fontFamily: fonts.bodyBold, marginTop: 3 },
  widgetClose: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
});
