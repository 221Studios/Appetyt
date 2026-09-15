import { StyleSheet } from 'react-native';

export const colors = {
  background: '#fbf8f4',
  paper: '#ffffff',
  ink: '#292522',
  muted: '#766f68',
  line: '#e9e1d8',
  orange: '#dd6b39',
  orangeSoft: '#fff0e7',
  green: '#4f8065',
  greenSoft: '#e8f1e9',
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 112 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.background },
  brand: { color: colors.orange, fontSize: 27, fontWeight: '800', letterSpacing: -0.8 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 35 },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '800', marginBottom: 12 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.paper, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 14 },
  button: { backgroundColor: colors.orange, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  buttonText: { color: colors.paper, fontSize: 15, fontWeight: '800' },
  ghostButton: { borderColor: colors.orange, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  ghostButtonText: { color: colors.orange, fontSize: 15, fontWeight: '800' },
});
