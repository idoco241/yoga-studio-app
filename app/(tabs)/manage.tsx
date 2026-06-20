import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useManageClasses, type ManagedClass } from '@/src/hooks/useManageClasses';
import { supabase } from '@/src/lib/supabase';

// Distinct palette for instructor avatars — cycles if there are more than 6 instructors
const INSTRUCTOR_COLORS = [
  { bg: '#6B7563', fg: '#fff' },  // sage (primary)
  { bg: '#B8923F', fg: '#fff' },  // gold
  { bg: '#7B6EA0', fg: '#fff' },  // lavender
  { bg: '#4A8E8B', fg: '#fff' },  // teal
  { bg: '#C0634A', fg: '#fff' },  // terracotta
  { bg: '#5B7EA6', fg: '#fff' },  // slate blue
];

function getInstructorColor(name: string, nameIndex: Record<string, number>) {
  return INSTRUCTOR_COLORS[nameIndex[name] % INSTRUCTOR_COLORS.length];
}

function initials(name: string) {
  if (!name.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('he-IL', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function InstructorBadge({ name, colorIdx }: { name: string; colorIdx: number }) {
  const color = INSTRUCTOR_COLORS[colorIdx % INSTRUCTOR_COLORS.length];
  return (
    <View style={[styles.avatarCircle, { backgroundColor: color.bg }]}>
      <Text style={[styles.avatarText, { color: color.fg }]}>{initials(name)}</Text>
    </View>
  );
}

function ClassManageCard({
  cls,
  colorIdx,
  onRoster,
  onEdit,
  onCancel,
}: {
  cls: ManagedClass;
  colorIdx: number;
  onRoster: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <InstructorBadge name={cls.instructorName} colorIdx={colorIdx} />
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
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="pencil" size={15} color={colors.fgMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="trash" size={15} color={colors.destructive} />
            </TouchableOpacity>
          </View>
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
  const [activeInstructor, setActiveInstructor] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  // Build stable instructor index (order of first appearance)
  const instructorIndex = useMemo<Record<string, number>>(() => {
    const idx: Record<string, number> = {};
    let counter = 0;
    classes.forEach((c) => {
      if (!(c.instructorName in idx)) { idx[c.instructorName] = counter++; }
    });
    return idx;
  }, [classes]);

  const instructorNames = useMemo(() => Object.keys(instructorIndex), [instructorIndex]);

  const filtered = useMemo(
    () => activeInstructor ? classes.filter((c) => c.instructorName === activeInstructor) : classes,
    [classes, activeInstructor]
  );

  async function handleCancel(cls: ManagedClass) {
    const confirmed = await new Promise<boolean>((resolve) =>
      Alert.alert(
        'Cancel Class',
        `Cancel "${cls.title}" on ${formatDateTime(cls.scheduledAt)}?`,
        [
          { text: 'No', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Cancel Class', style: 'destructive', onPress: () => resolve(true) },
        ]
      )
    );
    if (!confirmed) return;
    setCancelling(cls.id);
    const { error: err } = await supabase.from('classes').delete().eq('id', cls.id);
    setCancelling(null);
    if (err) { Alert.alert('Error', err.message); return; }
    refetch();
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.manageTitle}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/class/new' as any)}>
          <Icon name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Instructor filter bar — always visible once data loads */}
      {!loading && instructorNames.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterPill, activeInstructor === null && styles.filterPillActive]}
            onPress={() => setActiveInstructor(null)}
          >
            <Text style={[styles.filterText, activeInstructor === null && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {instructorNames.map((name) => {
            const active = activeInstructor === name;
            const color = INSTRUCTOR_COLORS[instructorIndex[name] % INSTRUCTOR_COLORS.length];
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.filterPill,
                  active && { backgroundColor: color.bg, borderColor: color.bg },
                ]}
                onPress={() => setActiveInstructor(active ? null : name)}
              >
                <Text style={[styles.filterText, active && { color: color.fg }]}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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

        {!loading && !error && filtered.length === 0 && (
          <Card style={styles.empty}>
            <Icon name="calendar" size={28} color={colors.fgMuted} />
            <Text style={styles.emptyTitle}>{t.noManagedClasses}</Text>
            <Text style={styles.emptySub}>Tap + to schedule one</Text>
          </Card>
        )}

        {!loading && !error && filtered.map((cls) => (
          <View key={cls.id} style={cancelling === cls.id && styles.cancelling}>
            <ClassManageCard
              cls={cls}
              colorIdx={instructorIndex[cls.instructorName] ?? 0}
              onRoster={() => router.push(`/roster/${cls.id}` as any)}
              onEdit={() => router.push(`/class/edit/${cls.id}` as any)}
              onCancel={() => handleCancel(cls)}
            />
          </View>
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

  // Filter bar
  filterScroll: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing[6], paddingVertical: spacing[3], gap: spacing[2] },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.fgMuted, fontFamily: fonts.sans },
  filterTextActive: { color: '#fff', fontFamily: fonts.sansMd },

  list: { padding: spacing[6] },
  center: { paddingVertical: spacing[8], alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted },
  empty: { padding: spacing[8], alignItems: 'center', gap: spacing[3] },
  emptyTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  emptySub: { fontSize: fontSize.sm, color: colors.fgMuted },
  cancelling: { opacity: 0.4 },

  // Card
  card: { padding: spacing[4], marginBottom: spacing[3] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  avatarCircle: {
    width: 42, height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 42,
  },
  avatarText: { fontSize: 14, fontFamily: fonts.sansMd },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg, marginBottom: 4 },
  cardMeta: { fontSize: fontSize.sm, color: colors.fgMuted, lineHeight: 20 },
  cardRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 12, color: colors.fgMuted },
  iconRow: { flexDirection: 'row', gap: spacing[3], marginTop: 4 },

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
