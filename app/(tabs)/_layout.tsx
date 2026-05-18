import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';
import { useLocale } from '@/src/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={24}
      color={focused ? colors.primary : colors.fgMuted}
    />
  );
}

export default function TabLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.fg,
        tabBarInactiveTintColor: colors.fgMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '400' },
        tabBarItemStyle: { paddingBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? colors.primary : colors.fgMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: t.nav.classes,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={focused ? colors.primary : colors.fgMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t.nav.bookings,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={focused ? colors.primary : colors.fgMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={focused ? colors.primary : colors.fgMuted} />
          ),
        }}
      />
    </Tabs>
  );
}
