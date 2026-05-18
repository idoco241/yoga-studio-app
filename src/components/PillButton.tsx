import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, fontSize } from '../theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface PillButtonProps {
  children: string;
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PillButton({ children, variant = 'primary', size = 'md', onPress, style, fullWidth }: PillButtonProps) {
  const btnStyle = [
    styles.base,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    style,
  ];
  const textStyle = [styles.baseText, styles[`${size}Text` as keyof typeof styles], styles[`${variant}Text` as keyof typeof styles]];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} activeOpacity={0.8}>
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  // sizes
  sm:   { paddingVertical: 6,  paddingHorizontal: 18 },
  md:   { paddingVertical: 10, paddingHorizontal: 22 },
  lg:   { paddingVertical: 14, paddingHorizontal: 28 },
  // variants
  primary: { backgroundColor: colors.primary },
  outline:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost:    { backgroundColor: 'transparent' },
  soft:     { backgroundColor: colors.primarySoft },
  // text sizes
  smText:  { fontSize: 13 },
  mdText:  { fontSize: 14 },
  lgText:  { fontSize: 15 },
  // text colors
  baseText:     { fontWeight: '500' },
  primaryText:  { color: colors.primaryFg },
  outlineText:  { color: colors.primary },
  ghostText:    { color: colors.primary },
  softText:     { color: colors.primary },
});
