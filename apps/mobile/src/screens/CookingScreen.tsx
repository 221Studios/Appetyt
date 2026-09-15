import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { RecipeDetail } from '../api/types';
import { colors, styles } from '../theme';

export function CookingScreen({ recipe, onClose }: { recipe: RecipeDetail; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = recipe.steps[step];
  const done = step >= recipe.steps.length - 1;
  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={onClose}><Text style={styles.ghostButtonText}>‹ Zamknij tryb gotowania</Text></Pressable><Text style={[styles.eyebrow, { marginTop: 28 }]}>Tryb gotowania · krok {step + 1} z {recipe.steps.length}</Text><Text style={[styles.title, { marginTop: 8 }]}>{current.title}</Text><Text style={[styles.body, { fontSize: 18, lineHeight: 28, marginTop: 18 }]}>{current.instructions}</Text>{current.duration_minutes && <View style={{ backgroundColor: colors.greenSoft, borderRadius: 14, padding: 14, marginTop: 24 }}><Text style={{ color: colors.green, fontWeight: '800' }}>⏱ Około {current.duration_minutes} min</Text></View>}<View style={{ height: 8, backgroundColor: colors.line, borderRadius: 4, marginTop: 30 }}><View style={{ width: `${((step + 1) / recipe.steps.length) * 100}%`, height: 8, backgroundColor: colors.orange, borderRadius: 4 }} /></View><Pressable onPress={() => done ? onClose() : setStep((value) => value + 1)} style={[styles.button, { marginTop: 32 }]}><Text style={styles.buttonText}>{done ? 'Zakończ gotowanie' : 'Następny krok'}</Text></Pressable>{step > 0 && <Pressable onPress={() => setStep((value) => value - 1)} style={[styles.ghostButton, { marginTop: 10 }]}><Text style={styles.ghostButtonText}>Poprzedni krok</Text></Pressable>}</ScrollView></View>;
}
