import { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useManageClasses, type ManagedClass } from '@/src/hooks/useManageClasses';

function formatDateTime(date: Date): string {
  return date.toLocaleString('he-IL', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function ClassManageCard({ cls, onRoster }: { cls: ManagedClass; onRoster: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{cls.title}</Text>
          <Text style={styles.cardMeta}>{formatDateTime(cls.scheduledAt)}</Text>
          <Text style={styles.cardMeta}>{cls.instructorName}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.countRow}>
            <Icon name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={styles.countText}>{cls.confirmedCount}/{cls.maxCapacity}</Text>
          </View>
          {cls.waitlistCount > 0 && (
            <View style={styles.countRow}>
              <Icon name="time" size={13} color={colors.gold} />
              <Text style={styles.countText}>{cls.waitlistCount}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.rosterBtn} onPress={onRoster}>
        <Text style={styles.rosterBtnText}>Roster</Text>
        <Icon name="chevron-right" size={14} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}

export default function ManageScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { data: classes, loading, error, refetch } = useManageClasses();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.manageTitle}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/class/new' as any)}>
          <Icon name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
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

        {!loading && !error && classes.length === 0 && (
          <Card style={styles.empty}>
            <Icon name="calendar" size={28} color={colors.fgMuted} />
            <Text style={styles.emptyTitle}>{t.noManagedClasses}</Text>
            <Text style={styles.emptySub}>Tap + to schedule one</Text>
          </Card>
        )}

        {!loading && !error && classes.map((cls) => (
          <ClassManageCard
            key={cls.id}
            cls={cls}
            onRoster={() => router.push(`/roster/${cls.id}` as any)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    paddingTop: 80,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.serif, fontSize: fontSize['3xl'], color: colors.fg, lineHeight: 36 },
  addBtn: {
    width: 36, height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing[6] },
  center: { paddingVertical: spacing[8], alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted },
  empty: { padding: spacing[8], alignItems: 'center', gap: spacing[3] },
  emptyTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  emptySub: { fontSize: fontSize.sm, color: colors.fgMuted },
  card: { padding: spacing[4], marginBottom: spacing[3] },
  cardTop: { flexDirection: 'row', gap: spacing[3] },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg, marginBottom: 4 },
  cardMeta: { fontSize: fontSize.sm, color: colors.fgMuted, lineHeight: 20 },
  cardRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 12, color: colors.fgMuted },
  rosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rosterBtnText: { fontSize: fontSize.sm, fontFamily: fonts.sansMd, color: colors.primary },
});
