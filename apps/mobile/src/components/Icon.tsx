import { ComponentProps } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '../theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Icon({
  name,
  size = 22,
  color = colors.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export function BookmarkIcon({ saved, size = 20, color }: { saved: boolean; size?: number; color?: string }) {
  return <Icon name={saved ? 'bookmark' : 'bookmark-border'} size={size} color={color ?? (saved ? colors.orange : colors.ink)} />;
}
