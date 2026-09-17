import * as Haptics from 'expo-haptics';

export function tap() {
  void Haptics.selectionAsync();
}

export function confirmTap() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function notifyTap() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
