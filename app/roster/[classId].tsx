import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useRoster, type RosterEntry } from '@/src/hooks/useRoster';
import { supabase } from '@/src/lib/supabase';

function formatDateTime(date: Date): string {
  return date.toLocaleString('he-IL', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function AttendanceRow({
  entry,
  onToggle,
}: {
  entry: RosterEntry;
  onToggle: (bookingId: string, attended: boolean) => void;
}) {
  const isWaitlist = entry.status === 'waitlist';
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.clientName}>{entry.clientName}</Text>
        <View style={[styles.statusBadge, isWaitlist && styles.statusBadgeWaitlist]}>
          <Text style={[styles.statusText, isWaitlist && styles.statusTextWaitlist]}>
            {isWaitlist ? 'Waitlist' : 'Confirmed'}
          </Text>
        </View>
      </View>
      {!isWaitlist && (
        <TouchableOpacity
          style={[styles.checkbox, entry.attended && styles.checkboxChecked]}
          onPress={() => onToggle(entry.bookingId, !entry.attended)}
        >
          {entry.attended && <Icon name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RosterScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: roster, loading, error, refetch } = useRoster(classId);

  // Class title + date fetched via existing RPC
  const [classInfo, setClassInfo] = useState<{ title: string; scheduledAt: Date } | null>(null);

  useEffect(() => {
    supabase.rpc('get_class_by_id', { p_class_id: classId }).then(({ data }) => {
      if (data && data.length > 0) {
        setClassInfo({ title: data[0].title, scheduledAt: new Date(data[0].scheduled_at) });
      }
    });
  }, [classId]);

  const handleToggle = useCallback(async (bookingId: string, attended: boolean) => {
    // Optimistic update
    refetch();
    await supabase.rpc('mark_attendance', { p_booking_id: bookingId, p_attended: attended });
    refetch();
  }, [refetch]);

  const confirmed = roster.filter((r) => r.status === 'confirmed');
  const waitlist = roster.filter((r) => r.status === 'waitlist');
  const topPad = insets.top + spacing[4];
  const bottomPad = (Platform.OS === 'android' ? insets.bottom : 0) + spacing[6];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity style={[styles.back, { paddingTop: topPad }]} onPress={() => router.back()}>
        <Icon name="chevron-left" size={22} color={colors.fg} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        {classInfo && (
          <>
            <Text style={styles.classTitle}>{classInfo.title}</Text>
            <Text style={styles.classMeta}>{formatDateTime(classInfo.scheduledAt)}</Text>
          </>
        )}

        {/* Summary */}
        {!loading && !error && (
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={15} color={colors.primary} />
              <Text style={styles.summaryText}>{confirmed.length} confirmed</Text>
            </View>
            {waitlist.length > 0 && (
              <View style={styles.summaryItem}>
                <Icon name="time" size={15} color={colors.gold} />
                <Text style={styles.summaryText}>{waitlist.length} waitlist</Text>
              </View>
            )}
          </View>
        )}

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

        {!loading && !error && roster.length === 0 && (
          <Card style={styles.empty}>
            <Icon name="people" size={28} color={colors.fgMuted} />
            <Text style={styles.emptyTitle}>No participants yet</Text>
          </Card>
        )}

        {!loading && !error && roster.length > 0 && (
          <Card style={styles.rosterCard}>
            <Text style={styles.sectionLabel}>Attendance</Text>
            {roster.map((entry, i) => (
              <View key={entry.bookingId}>
                {i > 0 && <View style={styles.divider} />}
                <AttendanceRow entry={entry} onToggle={handleToggle} />
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  backLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fg },
  body: { padding: spacing[6] },
  classTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 40,
    marginBottom: spacing[1],
  },
  classMeta: { fontSize: fontSize.sm, color: colors.fgMuted, marginBottom: spacing[4] },
  summary: { flexDirection: 'row', gap: spacing[4], marginBottom: spacing[4] },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { fontSize: fontSize.sm, color: colors.fg },
  center: { paddingVertical: spacing[8], alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted, textAlign: 'center' },
  empty: { padding: spacing[6], alignItems: 'center', gap: spacing[3] },
  emptyTitle: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  rosterCard: { padding: 0, overflow: 'hidden' },
  sectionLabel: {
    fontFamily: fonts.sansMd,
    fontSize: 13,
    color: colors.fgMuted,
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  rowLeft: { flex: 1, gap: 4 },
  clientName: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusBadgeWaitlist: { backgroundColor: colors.muted },
  statusText: { fontSize: 10, fontFamily: fonts.sansMd, color: colors.primary },
  statusTextWaitlist: { color: colors.fgMuted },
  checkbox: {
    width: 26, height: 26,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
