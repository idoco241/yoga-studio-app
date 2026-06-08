import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Logo, PillButton, Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { enData } from '@/src/data';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { upcomingClasses } = enData;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Decorative arch backdrop */}
      <View style={styles.arch} />

      {/* Botanical leaf */}
      <Image
        source={require('@/assets/images/decor-botanical.svg')}
        style={styles.botanical}
        contentFit="contain"
      />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Logo />
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>{t.tagline}</Text>

      {/* Welcome */}
      {t.welcome.map((line, i) => (
        <Text key={i} style={styles.welcome}>{line}</Text>
      ))}

      {/* CTA */}
      <PillButton size="lg" fullWidth onPress={() => router.push('/classes' as any)} style={styles.cta}>
        {t.bookClass}
      </PillButton>

      {/* This Week Card */}
      <Card style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.iconCircle}>
            <Icon name="calendar" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{t.classesThisWeek}</Text>
            {upcomingClasses.map((c, i) => (
              <View key={i} style={styles.classRow}>
                <View>
                  <Text style={styles.classMeta}>{c.date} · {c.time}</Text>
                  <Text style={styles.className}>{c.name}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.fgMuted} />
              </View>
            ))}
            <TouchableOpacity onPress={() => router.push('/bookings' as any)}>
              <Text style={styles.viewAll}>{t.viewAllBookings}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: colors.bg },
  content:  { paddingHorizontal: spacing[6], paddingTop: 108, paddingBottom: spacing[6] },
  arch: {
    position: 'absolute',
    top: -60, right: -160,
    width: 360, height: 540,
    borderRadius: 180,
    backgroundColor: 'rgba(201, 184, 154, 0.25)',
    pointerEvents: 'none',
  },
  botanical: {
    position: 'absolute',
    top: 40, left: -30,
    width: 150, height: 300,
    opacity: 0.7,
    pointerEvents: 'none',
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing[8] },
  tagline: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.fg,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: 38,
  },
  welcome: {
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: { marginTop: spacing[5], marginBottom: spacing[6] },
  card: { padding: spacing[4] },
  cardInner: { flexDirection: 'row', gap: spacing[4] },
  iconCircle: {
    width: 48, height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg, marginBottom: spacing[2] },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  classMeta: { fontSize: fontSize.xs, color: colors.fgMuted },
  className: { fontSize: fontSize.sm, color: colors.fg, marginTop: 2 },
  viewAll: { fontFamily: fonts.sansMd, fontSize: fontSize.sm, color: colors.primary, marginTop: spacing[3] },
});
