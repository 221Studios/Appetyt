import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Icon } from './Icon';

export function Header({ onHome, onSettings, onProfile }: { onHome: () => void; onSettings: () => void; onProfile: () => void }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Strona główna" onPress={onHome} style={styles.brandButton}>
      <View style={styles.logo}><Icon name="restaurant" size={20} color={colors.paper} /></View>
      <View><Text style={styles.brand}>Appetyt</Text><Text style={styles.subtitle}>PRZEPIŚNIK</Text></View>
    </Pressable>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ustawienia" onPress={onSettings} style={styles.iconButton}>
        <Icon name="settings" size={24} color={colors.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Profil użytkownika" onPress={onProfile} style={styles.profile}>
        <Icon name="person" size={18} color={colors.paper} />
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(249,249,248,0.92)' },
  brandButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', shadowColor: colors.orange, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  brand: { color: colors.ink, fontSize: 18, fontFamily: fonts.headline, letterSpacing: -0.4 },
  subtitle: { color: colors.orange, fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 1.6, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  profile: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
});
