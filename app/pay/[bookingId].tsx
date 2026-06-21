import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Card, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';

interface PaymentData {
  paymentMethod: 'cash' | 'waived' | 'pending' | 'paid' | null;
  paymentUrl: string | null;
  instructorRole: 'owner' | 'instructor';
  className: string;
}

export default function PayScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          id,
          classes!inner(title, profiles!instructor_id(role)),
          payments(method, payment_url)
        `)
        .eq('id', bookingId)
        .single();

      if (cancelled || !booking) return;

      const cls = (booking as any).classes;
      const payment = (booking as any).payments?.[0] ?? null;

      setData({
        paymentMethod:  payment?.method ?? null,
        paymentUrl:     payment?.payment_url ?? null,
        instructorRole: (cls?.profiles as any)?.role ?? 'instructor',
        className:      cls?.title ?? '',
      });
      if (payment?.method === 'paid') setPaid(true);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [bookingId]));

  // Called when the WebView navigates — detect Green Invoice success redirect
  async function onNavigationChange(nav: WebViewNavigation) {
    // Green Invoice redirects to the callback URL with ?status=paid or similar
    // TODO: confirm the exact success URL/query param once real credentials are tested
    const url = nav.url ?? '';
    const isSuccess = url.includes('status=paid') || url.includes('payment-success') || url.includes('success=true');
    if (!isSuccess || paid) return;

    // Optimistically mark paid
    setPaid(true);

    await supabase.rpc('set_payment_method', {
      p_booking_id: bookingId,
      p_method: 'paid',
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevron-back" size={24} color={colors.fg} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.payTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && paid && (
        <View style={styles.center}>
          <Icon name="checkmark-circle" size={48} color={colors.primary} />
          <Text style={styles.successText}>{t.paySuccess}</Text>
        </View>
      )}

      {!loading && !paid && data && (
        <>
          {/* Instructor-taught or no payment URL yet → show informational card */}
          {(data.instructorRole !== 'owner' || !data.paymentUrl) && (
            <View style={styles.center}>
              <Card style={styles.infoCard}>
                <Icon name="cash" size={36} color={colors.gold} />
                <Text style={styles.infoTitle}>{data.className}</Text>
                <Text style={styles.infoBody}>{t.payInstructor}</Text>
              </Card>
            </View>
          )}

          {/* Owner-taught + payment URL available → load Green Invoice payment page */}
          {data.instructorRole === 'owner' && data.paymentUrl && (
            <WebView
              source={{ uri: data.paymentUrl }}
              style={styles.webview}
              onNavigationStateChange={onNavigationChange}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.center}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            />
          )}
        </>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  webview: { flex: 1 },
  successText: { fontFamily: fonts.sansMd, fontSize: 16, color: colors.primary, textAlign: 'center', marginTop: spacing[4] },
  infoCard: { padding: spacing[6], alignItems: 'center', gap: spacing[4], width: '100%' },
  infoTitle: { fontFamily: fonts.serifMd, fontSize: 18, color: colors.fg, textAlign: 'center' },
  infoBody: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fgMuted, textAlign: 'center', lineHeight: 22 },
});
