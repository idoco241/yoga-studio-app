import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';

interface ReviewEntry {
  bookingId: string;
  clientName: string;
  attended: boolean;
  paymentMethod: 'cash' | 'waived' | 'pending' | 'paid' | null;
  paymentUrl: string | null;
}

type PayAction = 'cash' | 'waived' | 'pending';

function StatusBadge({ method }: { method: ReviewEntry['paymentMethod'] }) {
  if (!method) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    cash:    { label: 'Cash',    color: colors.primary,     bg: colors.primarySoft },
    waived:  { label: 'Waived',  color: colors.fgMuted,     bg: colors.muted },
    pending: { label: 'Pending', color: colors.gold,        bg: colors.goldSoft },
    paid:    { label: 'Paid',    color: colors.primary,     bg: colors.primarySoft },
  };
  const s = map[method];
  if (!s) return null;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function PaymentReviewScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('get_payment_review', { p_class_id: classId });
    if (err) { setError(err.message); setLoading(false); return; }
    setEntries((data ?? []).map((r: any) => ({
      bookingId:     r.booking_id,
      clientName:    r.client_name ?? '',
      attended:      r.attended ?? false,
      paymentMethod: r.payment_method ?? null,
      paymentUrl:    r.payment_url ?? null,
    })));
    setLoading(false);
  }, [classId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAction(entry: ReviewEntry, action: PayAction) {
    setSaving(entry.bookingId);
    try {
      if (action === 'cash' || action === 'waived') {
        const { error: err } = await supabase.rpc('set_payment_method', {
          p_booking_id: entry.bookingId,
          p_method: action,
        });
        if (err) throw err;
        setEntries((prev) => prev.map((e) =>
          e.bookingId === entry.bookingId ? { ...e, paymentMethod: action } : e
        ));
      } else {
        // 'pending' → insert record first, then call edge function to send push + create payment link
        const { error: setErr } = await supabase.rpc('set_payment_method', {
          p_booking_id: entry.bookingId,
          p_method: 'pending',
        });
        if (setErr) throw setErr;

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-payment-request`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ bookingId: entry.bookingId }),
          }
        );
        if (!res.ok) throw new Error('Failed to send payment request');

        setEntries((prev) => prev.map((e) =>
          e.bookingId === entry.bookingId ? { ...e, paymentMethod: 'pending' } : e
        ));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setSaving(null);
    }
  }

  const allDone = entries.length > 0 && entries.every((e) => e.paymentMethod !== null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevron-back" size={24} color={colors.fg} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.paymentReviewTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

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

      {!loading && !error && entries.length === 0 && (
        <View style={styles.center}>
          <Icon name="people" size={32} color={colors.fgMuted} />
          <Text style={styles.emptyText}>No confirmed attendees</Text>
        </View>
      )}

      {!loading && !error && entries.length > 0 && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => {
            const isSaving = saving === entry.bookingId;
            const done = entry.paymentMethod !== null;
            return (
              <Card key={entry.bookingId} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{entry.clientName}</Text>
                    {entry.attended && (
                      <View style={styles.attendedBadge}>
                        <Icon name="checkmark" size={10} color={colors.primary} />
                        <Text style={styles.attendedText}>Attended</Text>
                      </View>
                    )}
                  </View>
                  {done && <StatusBadge method={entry.paymentMethod} />}
                </View>

                {!done && (
                  <View style={styles.actions}>
                    {isSaving ? (
                      <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.cashBtn]}
                          onPress={() => handleAction(entry, 'cash')}
                        >
                          <Text style={styles.actionBtnText}>{t.markCash}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.waivedBtn]}
                          onPress={() => handleAction(entry, 'waived')}
                        >
                          <Text style={[styles.actionBtnText, styles.waivedBtnText]}>{t.markWaived}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.requestBtn]}
                          onPress={() => handleAction(entry, 'pending')}
                        >
                          <Icon name="send" size={13} color="#fff" />
                          <Text style={styles.actionBtnText}>{t.requestPayment}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </Card>
            );
          })}

          {allDone && (
            <View style={styles.allDoneCard}>
              <Icon name="checkmark-circle" size={28} color={colors.primary} />
              <Text style={styles.allDoneText}>{t.paymentDone}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.serif, fontSize: fontSize.xl, color: colors.fg },
  scroll: { flex: 1, padding: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: fontSize.sm, color: colors.fgMuted },
  emptyText: { fontSize: fontSize.sm, color: colors.fgMuted },
  card: { padding: spacing[4], marginBottom: spacing[3] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clientInfo: { flex: 1, gap: 4 },
  clientName: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.fg },
  attendedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  attendedText: { fontSize: 11, color: colors.primary, fontFamily: fonts.sans },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: { fontSize: 12, fontFamily: fonts.sansMd },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontFamily: fonts.sansMd, color: '#fff' },
  cashBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  waivedBtn: { backgroundColor: 'transparent', borderColor: colors.border },
  waivedBtnText: { color: colors.fgMuted },
  requestBtn: { backgroundColor: colors.gold, borderColor: colors.gold },
  allDoneCard: {
    alignItems: 'center', gap: spacing[3], padding: spacing[6],
    backgroundColor: colors.primarySoft, borderRadius: radii.lg, marginTop: spacing[2],
  },
  allDoneText: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.primary },
});
