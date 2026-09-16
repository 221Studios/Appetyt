import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { tap } from '../haptics';
import { SettingsState } from '../state/localState';
import { colors, styles as common } from '../theme';
import { Icon } from './Icon';

export function SettingsModal({
  visible,
  settings,
  onClose,
  onSave,
}: {
  visible: boolean;
  settings: SettingsState;
  onClose: () => void;
  onSave: (settings: SettingsState) => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => { if (visible) setDraft(settings); }, [visible, settings]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.settingsIcon}><Icon name="settings" size={22} color={colors.muted} /></View>
            <View>
              <Text style={common.heading}>Ustawienia</Text>
              <Text style={common.muted}>Dostosuj działanie przepiśnika</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={20} color={colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionLabel}>KOSZTORYS I ZAKUPY</Text>
            <Toggle label="Ceny z kartami lojalnościowymi" description="Uwzględniaj rabaty przy estymacji dań" value={draft.discounts} onChange={(discounts) => setDraft({ ...draft, discounts })} />
            <Toggle label="Sugeruj zamienniki składników" description="Np. parmezan ↔ Grana Padano" value={draft.substitutes} onChange={(substitutes) => setDraft({ ...draft, substitutes })} />
            <Text style={styles.sectionLabel}>AKTYWNE GOTOWANIE</Text>
            <Toggle label="Sygnał dźwiękowy stopera" description="Odtwarzaj sygnał po upływie czasu kroku" value={draft.timerSound} onChange={(timerSound) => setDraft({ ...draft, timerSound })} />
            <Toggle label="Przypomnienia o ważności" description="Powiadom, gdy produkt przekroczy 3 dni" value={draft.reminders} onChange={(reminders) => setDraft({ ...draft, reminders })} />
            <View style={styles.info}>
              <Text style={styles.infoTitle}>Appetyt · MVP</Text>
              <Text style={common.muted}>Lokalny przepiśnik bez kont i synchronizacji.</Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={() => { tap(); onSave(draft); }} style={common.button}>
              <Text style={common.buttonText}>Zapisz preferencje</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => { tap(); onChange(!value); }} style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={common.muted}>{description}</Text>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(47,49,48,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  settingsIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  closeButton: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 10 },
  sectionLabel: { color: colors.orange, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginTop: 5 },
  toggleRow: { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleCopy: { flex: 1 },
  toggleLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  switch: { width: 41, height: 24, borderRadius: 12, backgroundColor: colors.surfaceHigh, padding: 3 },
  switchOn: { backgroundColor: colors.orange },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper },
  knobOn: { alignSelf: 'flex-end' },
  info: { backgroundColor: colors.surfaceLow, borderRadius: 13, padding: 12, alignItems: 'center', marginTop: 3 },
  infoTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 3 },
  footer: { padding: 14, borderTopWidth: 1, borderTopColor: colors.line },
});
