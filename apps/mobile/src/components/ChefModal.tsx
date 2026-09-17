import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecipeSummary } from '../api/types';
import { tap } from '../haptics';
import { chefSourceDomain, recipesForChef } from '../referenceLook';
import { recipePrice } from '../recipePresentation';
import { colors, fonts, styles as common } from '../theme';
import { Icon } from './Icon';
import { RecipeVisual } from './RecipeVisual';

type Chef = { id: string; name: string; recipesCount: number; avatarUrl: string };

export function ChefModal({
  chef,
  recipes,
  following,
  onToggleFollow,
  onOpenRecipe,
  onClose,
}: {
  chef: Chef;
  recipes: RecipeSummary[];
  following: boolean;
  onToggleFollow: () => void;
  onOpenRecipe: (id: string) => void;
  onClose: () => void;
}) {
  const chefRecipes = recipesForChef(recipes, chef.name);
  const domain = chefSourceDomain(chef.id);
  const openSource = () => {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    void Linking.openURL(url);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.hero}>
            <Pressable accessibilityLabel="Zamknij profil szefa" onPress={onClose} style={styles.close}>
              <Icon name="close" size={20} color={colors.ink} />
            </Pressable>
            <View style={styles.heroRow}>
              <Image source={{ uri: chef.avatarUrl }} style={styles.avatar} />
              <View style={styles.heroCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{chef.name}</Text>
                  <Icon name="verified" size={18} color={colors.paper} />
                </View>
                <Text style={styles.heroMeta}>{chefRecipes.length || chef.recipesCount} opublikowanych przepisów</Text>
              </View>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.actions}>
              <Pressable onPress={openSource} style={styles.sourceButton}>
                <Icon name="public" size={18} color={colors.orange} />
                <Text style={styles.sourceText} numberOfLines={1}>{domain}</Text>
                <Icon name="launch" size={14} color={colors.muted} />
              </Pressable>
              <Pressable
                accessibilityLabel={following ? `Przestań obserwować ${chef.name}` : `Obserwuj ${chef.name}`}
                onPress={() => { tap(); onToggleFollow(); }}
                style={[styles.follow, following && styles.followActive]}
              >
                <Icon name="favorite" size={18} color={following ? colors.orange : colors.paper} />
                <Text style={[styles.followText, following && styles.followTextActive]}>{following ? 'Obserwujesz' : 'Obserwuj szefa'}</Text>
              </Pressable>
            </View>
            <View style={styles.note}>
              <Icon name="verified" size={20} color={colors.green} />
              <Text style={common.muted}>Autorskie receptury z oficjalnych kanałów szefa. Waga, proporcje i technika bez sztucznych modyfikacji.</Text>
            </View>
            <Text style={common.heading}>Przepisy tego autora ({chefRecipes.length})</Text>
            {chefRecipes.length === 0
              ? <View style={styles.empty}><Text style={common.muted}>Więcej przepisów szefa pojawi się w kolejnych aktualizacjach katalogu.</Text></View>
              : chefRecipes.slice(0, 12).map((recipe) => (
                <Pressable key={recipe.id} onPress={() => { tap(); onOpenRecipe(recipe.id); }} style={styles.recipeRow}>
                  <RecipeVisual recipe={recipe} height={56} style={styles.recipeImage} />
                  <View style={styles.recipeCopy}>
                    <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                    <Text style={common.muted}>{recipe.duration_minutes} min · {recipePrice(recipe)}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(47,49,48,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  hero: { backgroundColor: colors.orange, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  close: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.paper, backgroundColor: colors.surfaceHigh },
  heroCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: colors.paper, fontSize: 22, fontFamily: fonts.headline, flexShrink: 1 },
  heroMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: fonts.body, marginTop: 4 },
  body: { padding: 16, paddingBottom: 28, gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  sourceButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { flex: 1, color: colors.ink, fontSize: 12, fontFamily: fonts.bodyBold },
  follow: { borderRadius: 12, backgroundColor: colors.orange, paddingHorizontal: 12, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  followActive: { backgroundColor: colors.orangeSoft },
  followText: { color: colors.paper, fontSize: 12, fontFamily: fonts.bodyBold },
  followTextActive: { color: colors.orange },
  note: { backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.line },
  empty: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  recipeRow: { backgroundColor: colors.paper, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line },
  recipeImage: { width: 56, borderRadius: 12 },
  recipeCopy: { flex: 1, minWidth: 0 },
  recipeTitle: { color: colors.ink, fontSize: 14, fontFamily: fonts.bodyBold },
});
