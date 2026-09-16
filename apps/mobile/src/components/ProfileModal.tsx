import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { tap } from '../haptics';
import { DietPref, ProfileState } from '../state/localState';
import { colors, styles as common } from '../theme';
import { Icon } from './Icon';

const LEVELS = ['Początkujący', 'Sous Chef', 'Szef Domu'] as const;
const DIETS: { id: DietPref; label: string }[] = [
  { id: 'wszystko', label: 'Wszystkozerne' },
  { id: 'wege', label: 'Wegetariańskie' },
  { id: 'ryby', label: 'Peskatarianizm' },
  { id: 'keto', label: 'Low Carb / Keto' },
];

export function ProfileModal({
  visible,
  profile,
  savedCount,
  fridgeCount,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: ProfileState;
  savedCount: number;
  fridgeCount: number;
  onClose: () => void;
  onSave: (profile: ProfileState) => void;
}) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => { if (visible) setDraft(profile); }, [visible, profile]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.profileIcon}><Icon name="person" size={22} color={colors.paper} /></View>
            <View>
              <Text style={common.heading}>Twój profil</Text>
              <Text style={styles.accent}>LOKALNY PRZEPIŚNIK</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={20} color={colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.metrics}>
              <Metric value={savedCount} label="Zapisanych dań" />
              <Metric value={fridgeCount} label="W lodówce" />
              <Metric value={profile.cookedCount} label="Ugotowanych" />
            </View>
            <Text style={styles.label}>IMIĘ KUCHARZA</Text>
            <TextInput value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} style={styles.input} />
            <Text style={styles.label}>POZIOM W KUCHNI</Text>
            <View style={styles.options}>
              {LEVELS.map((item) => (
                <Pressable key={item} onPress={() => { tap(); setDraft({ ...draft, level: item }); }} style={[styles.option, draft.level === item && styles.optionActive]}>
                  <Text style={[styles.optionText, draft.level === item && styles.optionTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>PREFERENCJE KULINARNE</Text>
            <View style={styles.options}>
              {DIETS.map((item) => (
                <Pressable key={item.id} onPress={() => { tap(); setDraft({ ...draft, diet: item.id }); }} style={[styles.optionHalf, draft.diet === item.id && styles.optionActive]}>
                  <Text style={[styles.optionText, draft.diet === item.id && styles.optionTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.info}>
              <Text style={styles.infoTitle}>Aplikacja bez kont i synchronizacji</Text>
              <Text style={common.muted}>Twoje zapisane przepisy, lodówka i zakupy zostają na tym urządzeniu.</Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={() => { tap(); onSave({ ...draft, name: draft.name.trim() || profile.name, cookedCount: profile.cookedCount }); }} style={common.button}>
              <Text style={common.buttonText}>Zapisz profil</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(47,49,48,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '91%', backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  profileIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  accent: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  closeButton: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, backgroundColor: colors.paper, borderRadius: 13, borderWidth: 1, borderColor: colors.line, padding: 10, alignItems: 'center' },
  metricValue: { color: colors.orange, fontSize: 22, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  input: { backgroundColor: colors.surfaceLow, borderRadius: 11, paddingHorizontal: 13, minHeight: 46, color: colors.ink, fontSize: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: { flex: 1, minWidth: 90, minHeight: 42, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  optionHalf: { width: '48%', minHeight: 42, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  optionActive: { backgroundColor: colors.orange },
  optionText: { color: colors.ink, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  optionTextActive: { color: colors.paper },
  info: { backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 12 },
  infoTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 3 },
  footer: { padding: 14, borderTopWidth: 1, borderTopColor: colors.line },
});
