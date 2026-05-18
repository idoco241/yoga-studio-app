import { createContext, useContext } from 'react';
import { enData, heData } from './data';

export type Locale = 'en' | 'he';

export interface Translations {
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  // nav — stays English in both locales
  nav: { home: string; classes: string; bookings: string; profile: string };
  // home
  tagline: string;
  welcome: string[];
  bookClass: string;
  classesThisWeek: string;
  viewAllBookings: string;
  classBooked: string;
  classBookedSub: (name: string) => string;
  // classes
  classesTitle: string;
  today: string;
  tomorrow: string;
  classTabs: string[];
  weekDates: { day: number; label: string }[];
  weekSelectedIdx: number;
  book: string;
  with: (name: string) => string;
  // bookings
  bookingsTitle: string;
  cancel: string;
  reschedule: string;
  bookingCancelled: string;
  noBookings: string;
  noBookingsSub: string;
  browseClasses: string;
  // profile
  profileTitle: string;
  profileMenu: string[];
  // data
  data: typeof enData | typeof heData;
}

const en: Translations = {
  dir: 'ltr', isRtl: false,
  nav: { home: 'Home', classes: 'Classes', bookings: 'Bookings', profile: 'Profile' },
  tagline: 'Move. Breathe. Be.',
  welcome: ['Welcome to your space', 'for balance and well-being.'],
  bookClass: 'Book a Class',
  classesThisWeek: 'Your Classes This Week',
  viewAllBookings: 'View All Bookings',
  classBooked: 'Class booked!',
  classBookedSub: (name) => `You're registered for ${name}`,
  classesTitle: 'Classes',
  today: 'Today, May 20',
  tomorrow: 'Tomorrow, May 21',
  classTabs: ['All', 'Yoga', 'Meditation', 'Specialty'],
  weekDates: [
    { day: 17, label: 'Sat' }, { day: 18, label: 'Sun' }, { day: 19, label: 'Mon' },
    { day: 20, label: 'Tue' }, { day: 21, label: 'Wed' }, { day: 22, label: 'Thu' }, { day: 23, label: 'Fri' },
  ],
  weekSelectedIdx: 3,
  book: 'Book',
  with: (name) => `with ${name}`,
  bookingsTitle: 'Bookings',
  cancel: 'Cancel',
  reschedule: 'Reschedule',
  bookingCancelled: 'Booking cancelled',
  noBookings: 'No Bookings Yet',
  noBookingsSub: 'Browse our schedule to book your first class',
  browseClasses: 'Browse Classes',
  profileTitle: 'Profile',
  profileMenu: ['My Bookings', 'My Profile', 'Payment Methods', 'Purchase History', 'Notifications', 'Help & Support'],
  data: enData,
};

const he: Translations = {
  dir: 'rtl', isRtl: true,
  nav: { home: 'Home', classes: 'Classes', bookings: 'Bookings', profile: 'Profile' },
  tagline: 'לזוז. לנשום. להיות.',
  welcome: ['ברוכים הבאים למרחב שלכם', 'לאיזון ולרווחה.'],
  bookClass: 'הזמינו שיעור',
  classesThisWeek: 'השיעורים שלך השבוע',
  viewAllBookings: 'הצג את כל ההזמנות',
  classBooked: 'השיעור הוזמן!',
  classBookedSub: (name) => `נרשמת לשיעור ${name}`,
  classesTitle: 'Classes',
  today: 'היום, 20 במאי',
  tomorrow: 'מחר, 21 במאי',
  classTabs: ['All', 'Yoga', 'Meditation', 'Specialty'],
  weekDates: [
    { day: 17, label: 'שבת' }, { day: 18, label: "א׳" }, { day: 19, label: "ב׳" },
    { day: 20, label: "ג׳" }, { day: 21, label: "ד׳" }, { day: 22, label: "ה׳" }, { day: 23, label: "ו׳" },
  ],
  weekSelectedIdx: 3,
  book: 'הזמן',
  with: (name) => `עם ${name}`,
  bookingsTitle: 'Bookings',
  cancel: 'ביטול',
  reschedule: 'שינוי מועד',
  bookingCancelled: 'ההזמנה בוטלה',
  noBookings: 'אין הזמנות עדיין',
  noBookingsSub: 'עיינו בלוח הזמנים כדי להזמין שיעור ראשון',
  browseClasses: 'עיון בשיעורים',
  profileTitle: 'Profile',
  profileMenu: ['ההזמנות שלי', 'הפרופיל שלי', 'אמצעי תשלום', 'היסטוריית רכישות', 'התראות', 'עזרה ותמיכה'],
  data: heData,
};

export const LOCALES: Record<Locale, Translations> = { en, he };

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: en,
});

export const useLocale = () => useContext(LocaleContext);
