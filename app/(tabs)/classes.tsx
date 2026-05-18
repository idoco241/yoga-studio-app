import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PillButton, Card, Icon, AvatarStack } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import type { ClassItem } from '@/src/data';

const PHOTO_COLORS = ['#D3C2A4', '#DDD0BE', '#DECFB4', '#E0D4BA'] as const;

function ClassThumb({ idx, size = 96 }: { idx: number; size?: number }) {
  return (
    <View style={[
      styles.thumb,
      { width: size, height: size, backgroundColor: PHOTO_COLORS[idx % PHOTO_COLORS.length] },
    ]} />
  );
}

function ClassRow({ cls, book, bookLabel }: { cls: ClassItem; book: string; bookLabel: (name: string) => string }) {
  const { t } = useLocale();
  return (
    <Card style={styles.classCard}>
      <ClassThumb idx={cls.img} />
      <View style={styles.classDetails}>
        <Text style={styles.className}>{cls.name}</Text>
        <Text style={styles.classMeta}>{cls.time} · {cls.duration}</Text>
        <Text style={styles.classMeta}>{t.with(cls.instructor)}</Text>
        <Text style={styles.classMeta}>{cls.studio}</Text>
      </View>
      <View style={styles.classAction}>
        <PillButton size="sm" variant="outline" onPress={() => {}}>{book}</PillButton>
        <View style={styles.signups}>
          <Icon name="users" size={12} color={colors.fgMuted} />
          <Text style={styles.signupCount}>{cls.signups}/{cls.capacity}</Text>
        </View>
        <AvatarStack avatars={cls.avatars} signups={cls.signups} size={18} />
      </View>
    </Card>
  );
}

export default function ClassesScreen() {
  const { t } = useLocale();
  const [tab, setTab] = useState(t.classTabs[0]);
  const [dateIdx, setDateIdx] = useState(t.weekSelectedIdx);
  const { todayClasses, tomorrowClasses } = t.data;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* Title + filter */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.classesTitle}</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter" size={22} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Date strip — dates ascend right-to-left, so reversed */}
        <View style={styles.dateStrip}>
          {[...t.weekDates].reverse().map((d, i) => {
            // Reversed array: idx in reversed array corresponds to (length-1-i) in original
            const origIdx = t.weekDates.length - 1 - i;
            const active = origIdx === dateIdx;
            return (
              <TouchableOpacity
                key={d.day}
                style={styles.datePill}
                onPress={() => setDateIdx(origIdx)}
              >
                <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.day}</Text>
                <Text style={[styles.dateLabel, active && styles.dateLabelActive]}>{d.label}</Text>
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
        <Text style={styles.sectionLabel}>{t.today}</Text>
        {todayClasses.map((c) => (
          <ClassRow key={c.id} cls={c} book={t.book} bookLabel={t.classBookedSub} />
        ))}
        <Text style={[styles.sectionLabel, { marginTop: spacing[3] }]}>{t.tomorrow}</Text>
        {tomorrowClasses.map((c) => (
          <ClassRow key={c.id} cls={c} book={t.book} bookLabel={t.classBookedSub} />
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
  // date strip
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
  // category tabs
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
  // list
  list: { padding: spacing[6], paddingTop: spacing[4] },
  sectionLabel: { fontFamily: fonts.sansMd, fontSize: 13, color: colors.fg, marginBottom: spacing[3] },
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
  signups: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signupCount: { fontSize: 11, color: colors.fgMuted },
});
