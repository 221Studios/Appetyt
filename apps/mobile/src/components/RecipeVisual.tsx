import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useState } from 'react';

import { RecipeSummary } from '../api/types';
import { recipeImageUrl } from '../referenceLook';
import { colors } from '../theme';

export function RecipeVisual({ recipe, style, imageStyle, height = 120 }: { recipe: RecipeSummary; style?: StyleProp<ViewStyle>; imageStyle?: StyleProp<ImageStyle>; height?: number }) {
  const [failed, setFailed] = useState(false);
  const uri = recipeImageUrl(recipe);
  return <View style={[styles.frame, { height, backgroundColor: colors.surfaceHigh }, style]}>
    {!failed
      ? <Image accessibilityLabel={`Zdjęcie: ${recipe.title}`} source={{ uri }} resizeMode="cover" style={[StyleSheet.absoluteFill, imageStyle]} onError={() => setFailed(true)} />
      : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.orangeSoft }]} />}
  </View>;
}

export function initials(name: string | undefined | null): string {
  if (!name) return 'A';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: 16, position: 'relative' },
});
