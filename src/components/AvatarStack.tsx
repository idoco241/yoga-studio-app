import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

const GRADIENTS = ['#C9B89A', '#B8923F', '#9FA38C'] as const;

interface BubbleProps {
  children: string;
  bg: string;
  textColor?: string;
  size: number;
  offset?: number;
}

function Bubble({ children, bg, textColor = '#fff', size, offset = 0 }: BubbleProps) {
  return (
    <View style={[
      styles.bubble,
      { width: size, height: size, borderRadius: radii.full, backgroundColor: bg, marginLeft: offset },
    ]}>
      <Text style={[styles.initials, { fontSize: size * 0.4, color: textColor }]}>{children}</Text>
    </View>
  );
}

interface AvatarStackProps {
  avatars: string[];
  signups: number;
  size?: number;
}

export function AvatarStack({ avatars, signups, size = 20 }: AvatarStackProps) {
  if (signups < 2 || avatars.length < 2) return null;
  const extra = signups - 2;
  return (
    <View style={styles.row}>
      <Bubble bg={GRADIENTS[0]} size={size}>{avatars[0]}</Bubble>
      <Bubble bg={GRADIENTS[1]} size={size} offset={-6}>{avatars[1]}</Bubble>
      {extra > 0 && (
        <Bubble bg={colors.muted} textColor={colors.primary} size={size} offset={-6}>
          {`+${extra}`}
        </Bubble>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  initials: { fontWeight: '600', letterSpacing: 0 },
});
