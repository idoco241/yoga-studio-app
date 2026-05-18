import { Stack } from 'expo-router';
import { useState } from 'react';
import { LocaleContext, LOCALES, Locale } from '@/src/i18n';

export default function RootLayout() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = LOCALES[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      <Stack screenOptions={{ headerShown: false }} />
    </LocaleContext.Provider>
  );
}
