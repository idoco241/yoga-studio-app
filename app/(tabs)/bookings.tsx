import { useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PillButton, Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useMyBookings, type MyBooking } from '@/src/hooks/useMyBookings';
import { supabase } from '@/src/lib/supabase';

function formatDateTime(date: Date, locale: string): string {
  return date.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: locale !== 'he',
  });
}

function BookingCard({ booking, locale, onCancel, onViewClass, cancelLabel, rescheduleLabel, withFn }: {
  booking: MyBooking;
  locale: string;
  onCancel: () => void;
  onViewClass: () => void;
  cancelLabel: string;
  rescheduleLabel: string;
  withFn: (name: string) => string;
}) {
  const isWaitlist = booking.status === 'waitlist';
  return (
    <Card style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingName}>{booking.title}</Text>
        <View style={[styles.statusBadge, isWaitlist && styles.statusBadgeWaitlist]}>
          <Text style={[styles.statusText, isWaitlist && styles.statusTextWaitlist]}>
            {isWaitlist
              ? (locale === 'he' ? 'המתנה' : 'Waitlist')
              : (locale === 'he' ? 'מאושר' : 'Confirmed')}
          </Text>
        </View>
      </View>
      <Text style={styles.bookingMeta}>{formatDateTime(booking.scheduledAt, locale)}</Text>
      <Text style={styles.bookingMeta}>{withFn(booking.instructor)}</Text>

      <View style={styles.actions}>
        <PillButton variant="outline" size="sm" style={{ flex: 1 }} onPress={onCancel}>
          {cancelLabel}
        </PillButton>
        <PillButton size="sm" style={{ flex: 1 }} onPress={onViewClass}>
          {locale === 'he' ? 'פרטים' : 'Details'}
        </PillButton>
      </View>
    </Card>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { data: bookings, loading, error, refetch } = useMyBookings();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  async function handleCancel(booking: MyBooking) {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        locale === 'he' ? 'ביטול הזמנה' : 'Cancel Booking',
        locale === 'he'
          ? `לבטל את ${booking.title}?`
          : `Cancel ${booking.title}?`,
        [
          { text: locale === 'he' ? 'לא' : 'No',  style: 'cancel',      onPress: () => resolve(false) },
          { text: locale === 'he' ? 'כן' : 'Yes', style: 'destructive', onPress: () => resolve(true)  },
        ]
      );
    });
    if (!confirmed) return;

    const { error: err } = await supabase.rpc('cancel_booking', { p_booking_id: booking.id });
    if (err) {
      Alert.alert(locale === 'he' ? 'שגיאה' : 'Error', err.message);
    } else {
      refetch();
    }
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.bookingsTitle}</Text>
      </View>

      <View style={styles.list}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && bookings.length === 0 && (
          <Card style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar" size={28} color={colors.fgMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t.noBookings}</Text>
            <Text style={styles.emptySub}>{t.noBookingsSub}</Text>
            <PillButton onPress={() => router.push('/classes' as any)}>
              {t.browseClasses}
            </PillButton>
          </Card>
        )}

        {!loading && !error && bookings.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            locale={locale}
            onCancel={() => handleCancel(b)}
            onViewClass={() => router.push(`/class/${b.classId}` as any)}
            cancelLabel={t.cancel}
            rescheduleLabel={t.reschedule}
            withFn={t.with}
          />
        ))}
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
  center: { paddingVertical: spacing[8], alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted },
  // empty state
  empty: { padding: spacing[8], alignItems: 'center' },
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  bookingName: { fontFamily: fonts.sansMd, fontSize: 16, color: colors.fg, flex: 1, marginRight: spacing[2] },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusBadgeWaitlist: { backgroundColor: colors.muted },
  statusText: { fontSize: 10, fontFamily: fonts.sansMd, color: colors.primary },
  statusTextWaitlist: { color: colors.fgMuted },
  bookingMeta: { fontSize: fontSize.sm, color: colors.fgMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
});
