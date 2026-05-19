import { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView,
  ScrollView, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/lib/auth';
import { PillButton } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { t } = useLocale();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSignUp() {
    if (!displayName || !email || !password) return;
    setError('');
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (needsConfirmation) { setAwaitingConfirmation(true); return; }
    router.replace('/(tabs)' as any);
  }

  if (awaitingConfirmation) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmIcon}>✉️</Text>
        <Text style={styles.confirmTitle}>{t.checkEmail}</Text>
        <Text style={styles.confirmSub}>{email}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(auth)/login' as any)}>
          <Text style={styles.footerLink}>{t.signIn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.brandName}>RS Yoga</Text>
          <Text style={styles.tagline}>Move. Breathe. Be.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t.signUp}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t.displayNameLabel}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.fgSubtle}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.emailLabel}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.passwordLabel}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.fgSubtle}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PillButton
            fullWidth
            size="lg"
            onPress={handleSignUp}
            style={styles.btn}
          >
            {loading ? '...' : t.signUp}
          </PillButton>
        </View>

        {/* Switch to login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.haveAccount} </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
            <Text style={styles.footerLink}>{t.signIn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
    paddingTop: 80,
  },
  logoArea: { alignItems: 'center', marginBottom: spacing[10] },
  brandName: {
    fontFamily: fonts.serifSb,
    fontSize: 44,
    color: colors.fg,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: fonts.sansLt,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
  },
  formTitle: {
    fontFamily: fonts.serifMd,
    fontSize: fontSize['2xl'],
    color: colors.fg,
    marginBottom: spacing[5],
  },
  field: { marginBottom: spacing[4] },
  label: {
    fontFamily: fonts.sansMd,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    marginBottom: spacing[1],
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.fg,
    backgroundColor: colors.bg,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.destructive,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  btn: { marginTop: spacing[2] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fgMuted },
  footerLink: { fontFamily: fonts.sansMd, fontSize: fontSize.sm, color: colors.primary },
  // confirmation state
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  confirmIcon: { fontSize: 48, marginBottom: spacing[4] },
  confirmTitle: {
    fontFamily: fonts.serifMd,
    fontSize: fontSize['2xl'],
    color: colors.fg,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  confirmSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.fgMuted,
    marginBottom: spacing[8],
  },
  backLink: { marginTop: spacing[2] },
});
