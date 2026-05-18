import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, fonts, fontSize } from '../theme';

interface LogoProps {
  size?: 'sm' | 'md';
}

export function Logo({ size = 'md' }: LogoProps) {
  const logoSize = size === 'sm' ? 40 : 64;
  const logoHeight = size === 'sm' ? 32 : 52;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/rs-logo-lotus.svg')}
        style={{ width: logoSize, height: logoHeight, marginBottom: 12 }}
        contentFit="contain"
      />
      <Text style={[styles.wordmark, size === 'sm' && styles.wordmarkSm]}>RS YOGA</Text>
      <Text style={styles.sub}>STUDIO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: fontSize.xl,
    letterSpacing: 6,
    color: colors.fg,
    marginBottom: 2,
  },
  wordmarkSm: {
    fontSize: fontSize.lg,
    letterSpacing: 4,
  },
  sub: {
    fontFamily: fonts.sansLt,
    fontSize: fontSize.xs,
    letterSpacing: 3,
    color: colors.fgMuted,
  },
});
