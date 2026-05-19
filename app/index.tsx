import { Redirect } from 'expo-router';
import { useAuth } from '@/src/lib/auth';

export default function Index() {
  const { session } = useAuth();
  return session
    ? <Redirect href={'/(tabs)' as any} />
    : <Redirect href={'/(auth)/login' as any} />;
}
