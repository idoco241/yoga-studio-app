import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Maps design-system icon names to Ionicons
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  home:           'home',
  'home-outline': 'home-outline',
  calendar:       'calendar-outline',
  bookmark:       'bookmark-outline',
  'bookmark-fill':'bookmark',
  user:           'person-outline',
  users:          'people-outline',
  'chevron-left': 'chevron-back',
  'chevron-right':'chevron-forward',
  filter:         'options-outline',
  settings:       'settings-outline',
  clock:          'time-outline',
  check:          'checkmark',
  x:              'close',
  plus:           'add',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = colors.fg }: IconProps) {
  const glyphName = ICON_MAP[name] ?? (name as keyof typeof Ionicons.glyphMap);
  return <Ionicons name={glyphName} size={size} color={color} />;
}
