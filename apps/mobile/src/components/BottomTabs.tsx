import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export type Tab = 'discover' | 'search' | 'fridge' | 'shopping' | 'saved';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'discover', label: 'Odkrywaj', icon: '✦' },
  { id: 'search', label: 'Szukaj', icon: '⌕' },
  { id: 'fridge', label: 'Lodówka', icon: '▣' },
  { id: 'shopping', label: 'Zakupy', icon: '▤' },
  { id: 'saved', label: 'Zapisane', icon: '♡' },
];

export function BottomTabs({ active, shoppingCount, onChange }: { active: Tab; shoppingCount: number; onChange: (tab: Tab) => void }) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label} style={styles.tab} onPress={() => onChange(tab.id)}>
          <View>
            <Text style={[styles.icon, active === tab.id && styles.active]}>{tab.icon}</Text>
            {tab.id === 'shopping' && shoppingCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{shoppingCount}</Text></View>}
          </View>
          <Text style={[styles.label, active === tab.id && styles.active]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 78, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 8 },
  tab: { alignItems: 'center', minWidth: 56 },
  icon: { color: colors.muted, fontSize: 23, textAlign: 'center' },
  active: { color: colors.orange },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  badge: { position: 'absolute', right: -11, top: -4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.paper, fontSize: 10, fontWeight: '800' },
});
