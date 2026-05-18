import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/src/components';
import { colors, spacing, fontSize, fonts, radii } from '@/src/theme';
import { useLocale } from '@/src/i18n';

function MenuRow({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={20} color={colors.fgMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useLocale();
  const { user } = t.data;

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
          <Text style={styles.initials}>{user.initials}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {t.profileMenu.map((label, i) => (
          <MenuRow key={i} label={label} />
        ))}
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
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
  },
  userName: {
    fontFamily: fonts.serif,
    fontSize: fontSize['2xl'],
    fontWeight: '500',
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
});
