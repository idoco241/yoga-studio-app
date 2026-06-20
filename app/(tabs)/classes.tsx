import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PillButton, Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useClasses, type ClassRow } from '@/src/hooks/useClasses';
import { supabase } from '@/src/lib/supabase';

const PHOTO_COLORS = ['#D3C2A4', '#DDD0BE', '#DECFB4', '#E0D4BA'] as const;

const INSTRUCTOR_COLORS = [
  { bg: '#6B7563', fg: '#fff' },
  { bg: '#B8923F', fg: '#fff' },
  { bg: '#7B6EA0', fg: '#fff' },
  { bg: '#4A8E8B', fg: '#fff' },
  { bg: '#C0634A', fg: '#fff' },
  { bg: '#5B7EA6', fg: '#fff' },
];

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", 'שבת'];

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
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
  if (isToday) return 'היום';
  if (isTomorrow) return 'מחר';
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
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [dateIdx, setDateIdx] = useState(0);
  const dateScrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState(t.classTabs[0]);
  const [activeInstructor, setActiveInstructor] = useState<string | null>(null);
  const [staffNames, setStaffNames] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);
  const isProgrammaticScroll = useRef(false);
  const activeIdxRef = useRef(0);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .in('role', ['owner', 'instructor'])
      .then(({ data }) => {
        if (data) setStaffNames(data.map((r: any) => r.display_name || 'Unnamed'));
      });
  }, []);

  const daysToShow = (6 - today.getDay()) + 8;
  const weekDates = useMemo(() =>
    Array.from({ length: daysToShow }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    }), [today, daysToShow]);

  const endDate = weekDates[weekDates.length - 1];
  const categoryFilter = tab === t.classTabs[0] ? undefined : tab.toLowerCase();
  const { data: classes, loading, error, refetch } = useClasses(today, endDate, categoryFilter);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const staffColorIndex = useMemo<Record<string, number>>(() => {
    const idx: Record<string, number> = {};
    staffNames.forEach((name, i) => { idx[name] = i; });
    return idx;
  }, [staffNames]);

  const filtered = useMemo(
    () => activeInstructor ? classes.filter((c) => c.instructor === activeInstructor) : classes,
    [classes, activeInstructor]
  );

  // Group classes by day — every weekDate gets a section, even if empty
  const grouped = useMemo(() => {
    const byDay = new Map<string, ClassRow[]>();
    filtered.forEach((c) => {
      const key = c.scheduledAt.toDateString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(c);
    });
    return weekDates.map((d) => ({
      date: d,
      key: d.toDateString(),
      classes: byDay.get(d.toDateString()) ?? [],
    }));
  }, [filtered, weekDates]);

  // Tap a date pill → scroll the content to that day's section
  function scrollToSection(idx: number) {
    const y = sectionOffsets.current[idx];
    if (y == null) return;
    isProgrammaticScroll.current = true;
    activeIdxRef.current = idx;
    setDateIdx(idx);
    scrollRef.current?.scrollTo({ y, animated: true });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 600);
  }

  // Main content scrolls → update active date indicator
  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammaticScroll.current) return;
    const y = e.nativeEvent.contentOffset.y;
    const offsets = sectionOffsets.current;
    let active = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] != null && offsets[i] <= y + 40) active = i;
    }
    if (active !== activeIdxRef.current) {
      activeIdxRef.current = active;
      setDateIdx(active);
    }
  }

  return (
    <View style={styles.container}>
      {/* Fixed header — date strip + category tabs */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.classesTitle}</Text>
        </View>

        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => dateScrollRef.current?.scrollToEnd({ animated: false })}
          style={styles.dateScroll}
          contentContainerStyle={styles.dateScrollContent}
        >
          {weekDates.map((d, i) => {
            const active = i === dateIdx;
            const isToday = i === 0;
            const dayLabel = DAY_LABELS[d.getDay()];
            return (
              <TouchableOpacity
                key={i}
                style={styles.datePill}
                onPress={() => scrollToSection(i)}
              >
                <View style={[styles.dateNumWrap, isToday && styles.dateNumWrapToday]}>
                  <Text style={[styles.dateNum, active && styles.dateNumActive, isToday && styles.dateNumToday]}>
                    {d.getDate()}
                  </Text>
                </View>
                <Text style={[styles.dateLabel, active && styles.dateLabelActive]}>{dayLabel}</Text>
                {active && <View style={styles.dateUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

      {/* Instructor filter — View wrapper hard-constrains height so ScrollView can't expand */}
      {staffNames.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterPill, activeInstructor === null && styles.filterPillActive]}
              onPress={() => setActiveInstructor(null)}
            >
              <Text style={[styles.filterText, activeInstructor === null && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {staffNames.map((name) => {
              const active = activeInstructor === name;
              const color = INSTRUCTOR_COLORS[staffColorIndex[name] % INSTRUCTOR_COLORS.length];
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.filterPill, active && { backgroundColor: color.bg, borderColor: color.bg }]}
                  onPress={() => setActiveInstructor(active ? null : name)}
                >
                  <Text style={[styles.filterText, active && { color: color.fg, fontFamily: fonts.sansMd }]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Scrollable content — all days */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
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

        {!loading && !error && grouped.map((group, i) => (
          <View
            key={group.key}
            onLayout={(e) => { sectionOffsets.current[i] = e.nativeEvent.layout.y; }}
          >
            {/* Day separator */}
            <View style={styles.separator}>
              <View style={styles.sepLine} />
              <Text style={styles.sepLabel}>{sectionLabel(group.date, today)}</Text>
              <View style={styles.sepLine} />
            </View>

            {group.classes.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No classes</Text>
              </View>
            ) : (
              <View style={styles.dayClasses}>
                {group.classes.map((c) => (
                  <ClassCard
                    key={c.id}
                    cls={c}
                    bookLabel={t.book}
                    onPress={() => router.push(`/class/${c.id}` as any)}
                  />
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing[6],
    paddingBottom: 0,
    backgroundColor: colors.bg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 36,
  },
  dateScroll: { marginBottom: spacing[1] },
  dateScrollContent: { flexDirection: 'row-reverse' },
  datePill: {
    width: 44,
    alignItems: 'center',
    paddingVertical: 4,
    paddingBottom: 8,
    position: 'relative',
  },
  dateNumWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateNumWrapToday: { backgroundColor: colors.primary },
  dateNum: { fontFamily: fonts.serif, fontSize: 22, color: colors.fgMuted, lineHeight: 26 },
  dateNumActive: { color: colors.fg, fontFamily: fonts.serifMd },
  dateNumToday: { color: '#fff', fontFamily: fonts.serifMd },
  dateLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.fgMuted },
  dateLabelActive: { color: colors.fg, fontFamily: fonts.sansMd },
  dateUnderline: {
    position: 'absolute',
    bottom: 0, left: 8, right: 8,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  tabs: { flexDirection: 'row' },
  tab: { position: 'relative', paddingVertical: 6, paddingHorizontal: 14 },
  tabText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fgMuted },
  tabTextActive: { color: colors.fg, fontFamily: fonts.sansMd },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 8, right: 8,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  filterBar: {
    height: 44,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  filterContent: {
    height: 44,
    paddingHorizontal: spacing[6],
    gap: spacing[2],
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radii.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card,
  },
  filterPillActive: { backgroundColor: colors.fg, borderColor: colors.fg },
  filterText: { fontSize: fontSize.sm, color: colors.fgMuted, fontFamily: fonts.sans },
  filterTextActive: { color: '#fff', fontFamily: fonts.sansMd },
  scroll: { flex: 1 },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[3],
  },
  sepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  sepLabel: {
    fontFamily: fonts.sansMd,
    fontSize: 12,
    color: colors.fgMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyDay: { paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  emptyDayText: { fontSize: fontSize.sm, color: colors.fgMuted, fontStyle: 'italic' },
  dayClasses: { paddingHorizontal: spacing[6], paddingBottom: spacing[2] },
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
});
