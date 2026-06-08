import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PillButton, Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';

interface ClassDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  scheduledAt: Date;
  durationMinutes: number;
  maxCapacity: number;
  location: string | null;
  instructorName: string;
  confirmedCount: number;
  myBookingId: string | null;
  myBookingStatus: 'confirmed' | 'waitlist' | 'cancelled' | null;
}

function formatDateTime(date: Date, locale: string): string {
  return date.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: locale !== 'he',
  });
}

const CATEGORY_LABEL: Record<string, Record<string, string>> = {
  yoga:       { en: 'Yoga',       he: 'יוגה' },
  meditation: { en: 'Meditation', he: 'מדיטציה' },
  specialty:  { en: 'Specialty',  he: 'ייחודי' },
};

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale, t } = useLocale();

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  async function fetchClass() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_class_by_id', { p_class_id: id });
    if (!error && data && data.length > 0) {
      const row = data[0];
      setCls({
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        category: row.category,
        scheduledAt: new Date(row.scheduled_at),
        durationMinutes: row.duration_minutes,
        maxCapacity: row.max_capacity,
        location: row.location ?? null,
        instructorName: row.instructor_name ?? '',
        confirmedCount: row.confirmed_count ?? 0,
        myBookingId: row.my_booking_id ?? null,
        myBookingStatus: row.my_booking_status ?? null,
      });
    }
    setLoading(false);
  }

  useEffect(() => { fetchClass(); }, [id]);

  async function handleBook() {
    if (!cls) return;
    setBooking(true);
    const { data, error } = await supabase.rpc('book_class', { p_class_id: cls.id });
    setBooking(false);
    if (error) {
      Alert.alert(locale === 'he' ? 'שגיאה' : 'Error', error.message);
      return;
    }
    const status = data as string;
    const msg = status === 'confirmed'
      ? (locale === 'he' ? `נרשמת לשיעור ${cls.title}` : `You're registered for ${cls.title}`)
      : (locale === 'he' ? 'נוספת לרשימת המתנה' : 'Added to waitlist');
    Alert.alert(locale === 'he' ? 'הצלחה' : 'Success', msg);
    fetchClass();
  }

  async function handleCancel() {
    if (!cls?.myBookingId) return;
    setBooking(true);
    const { error } = await supabase.rpc('cancel_booking', { p_booking_id: cls.myBookingId });
    setBooking(false);
    if (error) {
      Alert.alert(locale === 'he' ? 'שגיאה' : 'Error', error.message);
      return;
    }
    fetchClass();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!cls) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>{locale === 'he' ? 'שיעור לא נמצא' : 'Class not found'}</Text>
      </View>
    );
  }

  const isFull = cls.confirmedCount >= cls.maxCapacity;
  const alreadyBooked = cls.myBookingStatus === 'confirmed' || cls.myBookingStatus === 'waitlist';
  const categoryLabel = CATEGORY_LABEL[cls.category]?.[locale] ?? cls.category;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Icon name="chevron-left" size={22} color={colors.fg} />
        <Text style={styles.backLabel}>{locale === 'he' ? 'חזרה' : 'Back'}</Text>
      </TouchableOpacity>

      {/* Hero thumb */}
      <View style={styles.hero} />

      <View style={styles.body}>
        {/* Category pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        <Text style={styles.title}>{cls.title}</Text>

        {cls.description ? (
          <Text style={styles.description}>{cls.description}</Text>
        ) : null}

        {/* Meta cards */}
        <Card style={styles.metaCard}>
          <MetaRow icon="calendar" label={formatDateTime(cls.scheduledAt, locale)} />
          <MetaRow icon="time" label={`${cls.durationMinutes} ${locale === 'he' ? 'דק׳' : 'min'}`} />
          <MetaRow icon="person" label={cls.instructorName} />
          {cls.location ? <MetaRow icon="location" label={cls.location} last /> : null}
        </Card>

        {/* Capacity */}
        <View style={styles.capacityRow}>
          <Icon name="users" size={16} color={colors.fgMuted} />
          <Text style={styles.capacityText}>
            {cls.confirmedCount}/{cls.maxCapacity}
            {isFull ? (locale === 'he' ? ' — מלא' : ' — Full') : ''}
          </Text>
        </View>

        {/* Booking status / action */}
        {alreadyBooked ? (
          <View style={styles.bookedBox}>
            <Icon
              name={cls.myBookingStatus === 'waitlist' ? 'time' : 'checkmark-circle'}
              size={20}
              color={cls.myBookingStatus === 'waitlist' ? colors.gold : colors.primary}
            />
            <Text style={styles.bookedText}>
              {cls.myBookingStatus === 'waitlist'
                ? (locale === 'he' ? 'אתה ברשימת המתנה' : 'You\'re on the waitlist')
                : (locale === 'he' ? 'נרשמת לשיעור זה' : 'You\'re registered')}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {!alreadyBooked ? (
            <PillButton
              size="lg"
              fullWidth
              onPress={handleBook}
              disabled={booking}
            >
              {booking
                ? (locale === 'he' ? 'מעבד...' : 'Processing...')
                : isFull
                  ? (locale === 'he' ? 'הצטרף לרשימת המתנה' : 'Join Waitlist')
                  : t.book}
            </PillButton>
          ) : (
            <PillButton
              size="lg"
              fullWidth
              variant="outline"
              onPress={handleCancel}
              disabled={booking}
            >
              {booking
                ? (locale === 'he' ? 'מעבד...' : 'Processing...')
                : t.cancel}
            </PillButton>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function MetaRow({ icon, label, last }: { icon: string; label: string; last?: boolean }) {
  return (
    <View style={[styles.metaRow, !last && styles.metaRowBorder]}>
      <Icon name={icon as any} size={16} color={colors.fgMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFound: { fontSize: fontSize.sm, color: colors.fgMuted },

  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 60,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  backLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fg },

  hero: {
    height: 200,
    backgroundColor: '#D3C2A4',
    marginHorizontal: spacing[6],
    borderRadius: radii.md,
  },

  body: { padding: spacing[6] },

  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  categoryText: { fontFamily: fonts.sansMd, fontSize: 11, color: colors.primary },

  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 40,
    marginBottom: spacing[3],
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    lineHeight: 22,
    marginBottom: spacing[4],
  },

  metaCard: { padding: 0, marginBottom: spacing[4], overflow: 'hidden' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  metaRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  metaLabel: { fontSize: fontSize.sm, color: colors.fg, flex: 1 },

  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  capacityText: { fontSize: fontSize.sm, color: colors.fgMuted },

  bookedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.muted,
    padding: spacing[3],
    borderRadius: radii.md,
    marginBottom: spacing[3],
  },
  bookedText: { fontSize: fontSize.sm, color: colors.fg, flex: 1 },

  actions: { gap: spacing[3] },
});
