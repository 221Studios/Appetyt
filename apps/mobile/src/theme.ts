import { StyleSheet } from 'react-native';

export const colors = {
  background: '#f9f9f8',
  paper: '#ffffff',
  ink: '#1a1c1c',
  muted: '#554336',
  line: '#e2e2e0',
  orange: '#fe932c',
  orangeSoft: '#ffdcc3',
  green: '#006d41',
  greenSoft: '#94f7bb',
  greenPale: '#e9f7ee',
  surfaceLow: '#f3f4f3',
  surface: '#eeeeed',
  surfaceHigh: '#e2e2e2',
  inverse: '#2f3130',
  inverseText: '#f1f1f0',
  error: '#ba1a1a',
};

export const fonts = {
  headline: 'Epilogue_800ExtraBold',
  headlineSemi: 'Epilogue_700Bold',
  body: 'PlusJakartaSans_500Medium',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 104 },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: colors.background },
  eyebrow: { color: colors.muted, fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyBold, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontFamily: fonts.headline, letterSpacing: -0.6 },
  heading: { color: colors.ink, fontSize: 19, lineHeight: 25, fontFamily: fonts.headline, letterSpacing: -0.25 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22, fontFamily: fonts.bodyRegular },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.bodyRegular },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: '#e8e8e7', marginBottom: 12, shadowColor: '#1a1c1c', shadowOpacity: 0.04, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  button: { backgroundColor: colors.orange, borderRadius: 13, minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.paper, fontSize: 14, fontFamily: fonts.bodyBold },
  ghostButton: { borderColor: colors.line, borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  ghostButtonText: { color: colors.ink, fontSize: 14, fontFamily: fonts.bodyBold },
});
