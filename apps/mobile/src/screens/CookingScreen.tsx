import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecipeDetail } from '../api/types';
import { Icon } from '../components/Icon';
import { confirmTap, tap } from '../haptics';
import { formatTimer } from '../state/useCookingSession';
import { colors, styles as common } from '../theme';

export function CookingScreen({
  recipe,
  index,
  seconds,
  running,
  onClose,
  onPrevious,
  onNext,
  onToggleRun,
  onAdjustSeconds,
}: {
  recipe: RecipeDetail;
  index: number;
  seconds: number;
  running: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRun: () => void;
  onAdjustSeconds: (seconds: number) => void;
}) {
  const current = recipe.steps[index] ?? recipe.steps[0];
  const start = Math.min(index, Math.max(0, recipe.ingredients.length - 4));
  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Zamknij tryb gotowania" onPress={onClose} style={styles.topButton}><Icon name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <View style={styles.topCopy}>
          <Text style={styles.kicker}>TRYB AKTYWNEGO GOTOWANIA</Text>
          <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
        </View>
        <Pressable accessibilityLabel="Zamknij" onPress={onClose} style={styles.topButton}><Icon name="close" size={22} color={colors.muted} /></Pressable>
      </View>
      <View style={styles.progress}>{recipe.steps.map((_, step) => <View key={step} style={[styles.progressPart, step < index && styles.progressDone, step === index && styles.progressCurrent]} />)}</View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>Krok {index + 1} z {recipe.steps.length}</Text>
          <View style={styles.timerPill}><Icon name="timer" size={18} color={colors.orange} /><Text style={styles.timer}>{formatTimer(seconds)}</Text></View>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <View style={styles.instructions}><Text style={styles.instructionsText}>{current.instructions}</Text></View>
        <View style={styles.timerControls}>
          <Pressable onPress={() => { tap(); onAdjustSeconds(seconds + 60); }} style={styles.timerAdjust}><Text style={styles.controlText}>+1 min</Text></Pressable>
          <Pressable accessibilityLabel={running ? 'Pauza' : 'Wznów'} onPress={() => { confirmTap(); onToggleRun(); }} style={styles.play}>
            <Icon name={running ? 'pause' : 'play-arrow'} size={28} color={colors.paper} />
          </Pressable>
          <Pressable onPress={() => { tap(); onAdjustSeconds(0); }} style={styles.timerAdjust}><Text style={styles.controlText}>Pomiń stoper</Text></Pressable>
        </View>
        <View style={styles.ingredients}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.ingredientsTitle}>SKŁADNIKI W TYM KROKU</Text>
            <Text style={styles.ingredientsCount}>{current.duration_minutes ? `${current.duration_minutes} min` : ''}</Text>
          </View>
          <View style={styles.ingredientPills}>
            {recipe.ingredients.slice(start, start + 4).map((ingredient) => (
              <View key={ingredient.name} style={styles.ingredientPill}>
                <Icon name="restaurant" size={16} color={colors.orange} />
                <Text style={styles.pillName} numberOfLines={1}>{ingredient.name}</Text>
                <Text style={styles.pillAmount}>{ingredient.amount_text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable disabled={index === 0} onPress={onPrevious} style={[styles.previous, index === 0 && styles.disabled]}>
          <Icon name="chevron-left" size={18} color={colors.ink} />
          <Text style={styles.previousText}>Poprzedni</Text>
        </Pressable>
        <Pressable onPress={() => { confirmTap(); onNext(); }} style={[common.button, { flex: 2, flexDirection: 'row', gap: 6 }]}>
          <Text style={common.buttonText}>{index === recipe.steps.length - 1 ? 'Zakończ gotowanie' : 'Następny krok'}</Text>
          {index < recipe.steps.length - 1 && <Icon name="chevron-right" size={18} color={colors.paper} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { minHeight: 68, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  topButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, alignItems: 'center' },
  kicker: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  recipeName: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 3 },
  progress: { flexDirection: 'row', gap: 5, paddingHorizontal: 14, paddingTop: 12 },
  progressPart: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceHigh },
  progressDone: { backgroundColor: colors.green },
  progressCurrent: { backgroundColor: colors.orange },
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  stepNumber: { color: colors.orange, fontSize: 20, fontWeight: '800' },
  timerPill: { backgroundColor: colors.surfaceLow, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  timer: { color: colors.ink, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  title: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', marginTop: 18 },
  instructions: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, marginTop: 15 },
  instructionsText: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  timerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 16 },
  timerAdjust: { backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 },
  controlText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  play: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  ingredients: { backgroundColor: colors.surfaceLow, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 13, marginTop: 22 },
  ingredientsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingredientsTitle: { color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  ingredientsCount: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  ingredientPills: { gap: 7, marginTop: 10 },
  ingredientPill: { backgroundColor: colors.paper, borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pillName: { color: colors.ink, flex: 1, fontSize: 11, fontWeight: '700' },
  pillAmount: { color: colors.orange, fontSize: 10, fontWeight: '800' },
  footer: { padding: 14, gap: 9, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background },
  previous: { flex: 1, minHeight: 48, backgroundColor: colors.surface, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
  previousText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.35 },
});
