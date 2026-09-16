import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';

export type Tab = 'discover' | 'search' | 'fridge' | 'shopping' | 'saved';

const tabs: { id: Tab; label: string; icon: IconName; filled: IconName }[] = [
  { id: 'discover', label: 'Odkrywaj', icon: 'local-dining', filled: 'local-dining' },
  { id: 'search', label: 'Szukaj', icon: 'search', filled: 'search' },
  { id: 'fridge', label: 'Lodówka', icon: 'kitchen', filled: 'kitchen' },
  { id: 'shopping', label: 'Zakupy', icon: 'shopping-basket', filled: 'shopping-basket' },
  { id: 'saved', label: 'Zapisane', icon: 'bookmark-border', filled: 'bookmark' },
];

export function BottomTabs({ active, shoppingCount, onChange }: { active: Tab; shoppingCount: number; onChange: (tab: Tab) => void }) {
  return <View style={styles.bar}>
    {tabs.map((tab) => {
      const selected = active === tab.id;
      const color = selected ? colors.orange : colors.muted;
      return <Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{ selected }} onPress={() => { void Haptics.selectionAsync(); onChange(tab.id); }} style={styles.tab}>
        <View style={styles.iconWrap}>
          <Icon name={selected ? tab.filled : tab.icon} size={22} color={color} />
          {tab.id === 'shopping' && shoppingCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{shoppingCount}</Text></View>}
        </View>
        <Text style={[styles.label, selected && styles.active]}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: 'rgba(249,249,248,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(232,232,231,0.4)', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  iconWrap: { position: 'relative', minHeight: 24, justifyContent: 'center' },
  label: { color: colors.muted, fontSize: 11, fontFamily: fonts.body, marginTop: 2 },
  active: { color: colors.orange, fontFamily: fonts.bodyBold },
  badge: { position: 'absolute', right: -9, top: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.paper, fontSize: 10, fontFamily: fonts.bodyBold },
});
