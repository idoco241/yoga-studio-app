import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PillButton, Card, Icon, AvatarStack } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import type { BookingItem } from '@/src/data';

export default function BookingsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [items, setItems] = useState<BookingItem[]>([...t.data.bookings]);

  const cancel = (id: string) => setItems((prev) => prev.filter((b) => b.id !== id));

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.bookingsTitle}</Text>
      </View>

      <View style={styles.list}>
        {items.length === 0 ? (
          <Card style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar" size={28} color={colors.fgMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t.noBookings}</Text>
            <Text style={styles.emptySub}>{t.noBookingsSub}</Text>
            <PillButton onPress={() => router.push('/classes' as any)}>{t.browseClasses}</PillButton>
          </Card>
        ) : (
          items.map((b) => (
            <Card key={b.id} style={styles.bookingCard}>
              <Text style={styles.bookingName}>{b.name}</Text>
              <Text style={styles.bookingMeta}>{b.date} · {b.time}</Text>
              <Text style={styles.bookingMeta}>{t.with(b.instructor)}</Text>
              <Text style={styles.bookingMeta}>{b.studio}</Text>

              <View style={styles.actions}>
                <PillButton
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() => cancel(b.id)}
                >
                  {t.cancel}
                </PillButton>
                <PillButton size="sm" style={{ flex: 1 }} onPress={() => {}}>
                  {t.reschedule}
                </PillButton>
              </View>

              <View style={styles.signupRow}>
                <View style={styles.signupCount}>
                  <Icon name="users" size={14} color={colors.fgMuted} />
                  <Text style={styles.signupText}>{b.signups}/{b.capacity}</Text>
                </View>
                <AvatarStack avatars={b.avatars} signups={b.signups} size={22} />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing[6],
    paddingTop: 80,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 36,
  },
  list: { padding: spacing[6] },
  // empty state
  empty: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64, height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: { fontFamily: fonts.sansMd, fontSize: 17, color: colors.fg, marginBottom: spacing[2], textAlign: 'center' },
  emptySub: { fontSize: fontSize.sm, color: colors.fgMuted, textAlign: 'center', marginBottom: spacing[5] },
  // booking card
  bookingCard: { padding: spacing[4], marginBottom: spacing[3] },
  bookingName: { fontFamily: fonts.sansMd, fontSize: 16, color: colors.fg, marginBottom: 4 },
  bookingMeta: { fontSize: fontSize.sm, color: colors.fgMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  signupCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signupText: { fontSize: 12, color: colors.fgMuted },
});
