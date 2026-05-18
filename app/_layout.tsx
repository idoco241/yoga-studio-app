import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Heebo_300Light,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
} from '@expo-google-fonts/heebo';
import {
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
} from '@expo-google-fonts/frank-ruhl-libre';
import { LocaleContext, LOCALES, Locale } from '@/src/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = LOCALES[locale];

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    Heebo_300Light,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    FrankRuhlLibre_400Regular,
    FrankRuhlLibre_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      <Stack screenOptions={{ headerShown: false }} />
    </LocaleContext.Provider>
  );
}
