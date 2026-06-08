import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PillButton, Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useClasses, type ClassRow } from '@/src/hooks/useClasses';

const PHOTO_COLORS = ['#D3C2A4', '#DDD0BE', '#DECFB4', '#E0D4BA'] as const;

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", 'שבת'];

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatDuration(mins: number): string {
  return `${mins} min`;
}

function sectionLabel(date: Date, today: Date): string {
  const isToday = date.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  return date.toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric' });
}

function ClassThumb({ idx, size = 96 }: { idx: number; size?: number }) {
  return (
    <View style={[
      styles.thumb,
      { width: size, height: size, backgroundColor: PHOTO_COLORS[idx % PHOTO_COLORS.length] },
    ]} />
  );
}

function ClassCard({ cls, bookLabel, onPress }: { cls: ClassRow; bookLabel: string; onPress: () => void }) {
  const booked = cls.myBookingStatus === 'confirmed' || cls.myBookingStatus === 'waitlist';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.classCard}>
        <ClassThumb idx={cls.id.charCodeAt(0) % 4} />
        <View style={styles.classDetails}>
          <Text style={styles.className}>{cls.title}</Text>
          <Text style={styles.classMeta}>{formatTime(cls.scheduledAt)} · {formatDuration(cls.durationMinutes)}</Text>
          <Text style={styles.classMeta}>{cls.instructor}</Text>
        </View>
        <View style={styles.classAction}>
          {booked ? (
            <View style={styles.bookedBadge}>
              <Icon name={cls.myBookingStatus === 'waitlist' ? 'time' : 'checkmark'} size={11} color={colors.primary} />
              <Text style={styles.bookedBadgeText}>
                {cls.myBookingStatus === 'waitlist' ? 'Waitlist' : 'Booked'}
              </Text>
            </View>
          ) : (
            <PillButton size="sm" variant="outline" onPress={onPress}>{bookLabel}</PillButton>
          )}
          <View style={styles.signupRow}>
            <Icon name="users" size={12} color={colors.fgMuted} />
            <Text style={styles.capacity}>{cls.confirmedCount}/{cls.maxCapacity}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ClassesScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const today = useMemo(() => new Date(), []);
  const [dateIdx, setDateIdx] = useState(0);
  const [tab, setTab] = useState(t.classTabs[0]);

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    }), [today]);

  const selectedDate = weekDates[dateIdx];
  const categoryFilter = tab === t.classTabs[0] ? undefined : tab.toLowerCase();
  const { data: classes, loading, error, refetch } = useClasses(selectedDate, categoryFilter);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.classesTitle}</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter" size={22} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Date strip — always RTL so today is on the right */}
        <View style={[styles.dateStrip, { flexDirection: 'row-reverse' }]}>
          {weekDates.map((d, i) => {
            const active = i === dateIdx;
            const dayLabel = DAY_LABELS[d.getDay()];
            return (
              <TouchableOpacity
                key={i}
                style={styles.datePill}
                onPress={() => setDateIdx(i)}
              >
                <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.getDate()}</Text>
                <Text style={[styles.dateLabel, active && styles.dateLabelActive]}>{dayLabel}</Text>
                {active && <View style={styles.dateUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category tabs */}
        <View style={styles.tabs}>
          {t.classTabs.map((tabName) => {
            const active = tabName === tab;
            return (
              <TouchableOpacity key={tabName} style={styles.tab} onPress={() => setTab(tabName)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tabName}</Text>
                {active && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.list}>
        <Text style={styles.sectionLabel}>{sectionLabel(selectedDate, today)}</Text>

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

        {!loading && !error && classes.length === 0 && (
          <Card style={styles.empty}>
            <Icon name="calendar" size={28} color={colors.fgMuted} />
            <Text style={styles.emptyTitle}>No classes this day</Text>
            <Text style={styles.emptySub}>Try selecting another date</Text>
          </Card>
        )}

        {!loading && !error && classes.map((c) => (
          <ClassCard
            key={c.id}
            cls={c}
            bookLabel={t.book}
            onPress={() => router.push(`/class/${c.id}` as any)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 72, paddingHorizontal: spacing[6], paddingBottom: 0 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 36,
  },
  filterBtn: { padding: 6 },
  dateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  datePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 10,
    position: 'relative',
  },
  dateNum: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.fgMuted,
    lineHeight: 26,
  },
  dateNumActive: { color: colors.fg, fontFamily: fonts.serifMd },
  dateLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.fgMuted },
  dateLabelActive: { color: colors.fg, fontFamily: fonts.sansMd },
  dateUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8, right: 8,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { position: 'relative', paddingVertical: 10, paddingHorizontal: 14, marginBottom: -1 },
  tabText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fgMuted },
  tabTextActive: { color: colors.fg, fontFamily: fonts.sansMd },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 8, right: 8,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  list: { padding: spacing[6], paddingTop: spacing[4] },
  sectionLabel: {
    fontFamily: fonts.sansMd,
    fontSize: 13,
    color: colors.fg,
    marginBottom: spacing[3],
  },
  classCard: {
    flexDirection: 'row',
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[3],
    alignItems: 'center',
  },
  thumb: { borderRadius: radii.sm, flexShrink: 0 },
  classDetails: { flex: 1, minWidth: 0 },
  className: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg, marginBottom: 4 },
  classMeta: { fontSize: fontSize.sm, color: colors.fgMuted, lineHeight: 20 },
  classAction: { alignItems: 'center', gap: 6, flexShrink: 0 },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  bookedBadgeText: { fontSize: 10, fontFamily: fonts.sansMd, color: colors.primary },
  signupRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  capacity: { fontSize: 11, color: colors.fgMuted },
  center: { paddingVertical: spacing[8], alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted, textAlign: 'center' },
  empty: { padding: spacing[6], alignItems: 'center', gap: spacing[3] },
  emptyTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  emptySub: { fontSize: fontSize.sm, color: colors.fgMuted },
});
