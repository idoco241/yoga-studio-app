import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PillButton, Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';

const CATEGORIES = ['yoga', 'meditation', 'specialty'] as const;
type Category = typeof CATEGORIES[number];
const CATEGORY_LABELS: Record<Category, string> = {
  yoga: 'Yoga', meditation: 'Meditation', specialty: 'Specialty',
};

interface StaffProfile { id: string; displayName: string; }

export default function EditClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const [loadingClass, setLoadingClass] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('yoga');
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('20');
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Fetch class data and staff list in parallel
  useEffect(() => {
    Promise.all([
      supabase
        .from('classes')
        .select('title, category, scheduled_at, duration_minutes, max_capacity, instructor_id')
        .eq('id', id)
        .single(),
      supabase.from('profiles').select('id, display_name').in('role', ['owner', 'instructor']),
    ]).then(([{ data: cls }, { data: staffData }]) => {
      if (cls) {
        setTitle(cls.title);
        setCategory((cls.category as Category) ?? 'yoga');
        setScheduledAt(new Date(cls.scheduled_at));
        setDuration(String(cls.duration_minutes));
        setCapacity(String(cls.max_capacity));
        setInstructorId(cls.instructor_id ?? null);
      }
      if (staffData) {
        setStaffList(staffData.map((r: any) => ({
          id: r.id,
          displayName: r.display_name || 'Unnamed',
        })));
      }
      setLoadingClass(false);
    });
  }, [id]);

  const topPad = insets.top + spacing[4];
  const bottomPad = (Platform.OS === 'android' ? insets.bottom : 0) + spacing[6];

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Missing field', 'Please enter a class title.'); return; }
    if (!instructorId) { Alert.alert('Missing field', 'Please select an instructor.'); return; }
    setSaving(true);

    const { error } = await supabase.from('classes').update({
      title: title.trim(),
      category,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: parseInt(duration, 10) || 60,
      max_capacity: parseInt(capacity, 10) || 20,
      instructor_id: instructorId,
    }).eq('id', id);

    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.back();
  }

  if (loadingClass) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={[styles.back, { paddingTop: topPad }]} onPress={() => router.back()}>
        <Icon name="chevron-left" size={22} color={colors.fg} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.pageTitle}>Edit Class</Text>

        {/* Instructor */}
        <Text style={styles.label}>Instructor</Text>
        <View style={styles.pillRow}>
          {staffList.map((s) => {
            const active = instructorId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setInstructorId(s.id)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{s.displayName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title */}
        <Text style={styles.label}>{t.classTitleLabel}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.fgMuted}
        />

        {/* Category */}
        <Text style={styles.label}>{t.categoryLabel}</Text>
        <View style={styles.pillRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, category === c && styles.pillActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.pillText, category === c && styles.pillTextActive]}>
                {CATEGORY_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>
            {scheduledAt.toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={scheduledAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                const next = new Date(scheduledAt);
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setScheduledAt(next);
              }
            }}
          />
        )}

        {/* Time */}
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.inputText}>
            {scheduledAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={scheduledAt}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) {
                const next = new Date(scheduledAt);
                next.setHours(date.getHours(), date.getMinutes());
                setScheduledAt(next);
              }
            }}
          />
        )}

        {/* Duration */}
        <Text style={styles.label}>{t.durationLabel}</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholderTextColor={colors.fgMuted}
        />

        {/* Capacity */}
        <Text style={styles.label}>{t.capacityLabel}</Text>
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
          placeholderTextColor={colors.fgMuted}
        />

        <PillButton
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: spacing[4] }}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : 'Save Changes'}
        </PillButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  back: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing[6], paddingBottom: spacing[3],
  },
  backLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.fg },
  body: { padding: spacing[6] },
  pageTitle: {
    fontFamily: fonts.serif, fontSize: fontSize['3xl'], color: colors.fg,
    lineHeight: 40, marginBottom: spacing[5],
  },
  label: {
    fontFamily: fonts.sansMd, fontSize: fontSize.sm, color: colors.fg,
    marginBottom: spacing[2], marginTop: spacing[4],
  },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: spacing[4], fontSize: fontSize.sm,
    color: colors.fg, fontFamily: fonts.sans, justifyContent: 'center',
  },
  inputText: { fontSize: fontSize.sm, color: colors.fg, fontFamily: fonts.sans },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  pill: {
    paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: radii.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: fontSize.sm, color: colors.fgMuted, fontFamily: fonts.sans },
  pillTextActive: { color: '#fff', fontFamily: fonts.sansMd },
});
