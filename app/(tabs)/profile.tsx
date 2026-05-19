import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';
import { useAuth } from '@/src/lib/auth';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MenuRow({ label, onPress, destructive }: { label: string; onPress?: () => void; destructive?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
      {!destructive && <Icon name="chevron-right" size={20} color={colors.fgMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useLocale();
  const { session, profile, signOut } = useAuth();

  const displayName = profile?.display_name || session?.user.email?.split('@')[0] || '';
  const email = session?.user.email || '';

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.profileTitle}</Text>
        <Icon name="settings" size={22} color={colors.fg} />
      </View>

      {/* User */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials(displayName)}</Text>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {t.profileMenu.map((label, i) => (
          <MenuRow key={i} label={label} />
        ))}
        <MenuRow label={t.signOut} onPress={signOut} destructive />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[6],
    paddingTop: 80,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize['3xl'],
    color: colors.fg,
    lineHeight: 36,
  },
  userSection: {
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  avatar: {
    width: 92, height: 92,
    borderRadius: radii.full,
    backgroundColor: '#C9B89A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  initials: {
    fontFamily: fonts.serifMd,
    fontSize: 28,
    color: '#fff',
  },
  userName: {
    fontFamily: fonts.serifMd,
    fontSize: fontSize['2xl'],
    color: colors.fg,
    marginBottom: 4,
  },
  userEmail: { fontSize: fontSize.sm, color: colors.fgMuted },
  menu: { paddingHorizontal: spacing[6] },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { fontSize: 15, color: colors.fg },
  menuLabelDestructive: { color: colors.destructive },
});
