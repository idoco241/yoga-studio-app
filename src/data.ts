export interface UpcomingClass {
  date: string;
  time: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  studio: string;
  img: number;
  signups: number;
  capacity: number;
  avatars: string[];
}

export interface BookingItem {
  id: string;
  name: string;
  date: string;
  time: string;
  instructor: string;
  studio: string;
  signups: number;
  capacity: number;
  avatars: string[];
}

export const enData = {
  upcomingClasses: [
    { date: 'Tue, May 20', time: '9:00 AM',  name: 'Vinyasa Flow' },
    { date: 'Thu, May 22', time: '6:30 PM',  name: 'Restorative Yoga' },
    { date: 'Sat, May 24', time: '10:00 AM', name: 'Gentle Flow' },
  ] as UpcomingClass[],

  todayClasses: [
    { id: '1', name: 'Vinyasa Flow',     instructor: 'Olivia', time: '9:00 AM',  duration: '60 min', studio: 'Studio A', img: 0, signups: 12, capacity: 20, avatars: ['EC', 'NL'] },
    { id: '2', name: 'Restorative Yoga', instructor: 'Sophia', time: '11:00 AM', duration: '75 min', studio: 'Studio B', img: 1, signups: 8,  capacity: 16, avatars: ['MA', 'TS'] },
    { id: '3', name: 'Yin Yoga',         instructor: 'Daniel', time: '6:00 PM',  duration: '60 min', studio: 'Studio A', img: 2, signups: 15, capacity: 20, avatars: ['RK', 'YB'] },
  ] as ClassItem[],

  tomorrowClasses: [
    { id: '4', name: 'Morning Flow', instructor: 'Olivia', time: '8:00 AM', duration: '60 min', studio: 'Studio A', img: 3, signups: 6, capacity: 20, avatars: ['AL', 'DH'] },
  ] as ClassItem[],

  bookings: [
    { id: '1', name: 'Vinyasa Flow',     date: 'Tue, May 20', time: '9:00 AM',  instructor: 'Olivia', studio: 'Studio A', signups: 12, capacity: 20, avatars: ['EC', 'NL'] },
    { id: '2', name: 'Restorative Yoga', date: 'Thu, May 22', time: '6:30 PM',  instructor: 'Sophia', studio: 'Studio B', signups: 8,  capacity: 16, avatars: ['MA', 'TS'] },
  ] as BookingItem[],

  user: { name: 'Jessica Taylor', email: 'jessica.taylor@email.com', initials: 'JT' },
} as const;

export const heData = {
  upcomingClasses: [
    { date: 'יום ג׳, 20 במאי', time: '9:00',  name: 'ויניאסה פלואו' },
    { date: 'יום ה׳, 22 במאי', time: '18:30', name: 'יוגה משקמת' },
    { date: 'שבת, 24 במאי',   time: '10:00', name: 'פלואו עדין' },
  ] as UpcomingClass[],

  todayClasses: [
    { id: '1', name: 'ויניאסה פלואו', instructor: 'אוליביה', time: '9:00',  duration: '60 דקות', studio: 'Studio A', img: 0, signups: 12, capacity: 20, avatars: ['אכ', 'נל'] },
    { id: '2', name: 'יוגה משקמת',   instructor: 'סופיה',   time: '11:00', duration: '75 דקות', studio: 'Studio B', img: 1, signups: 8,  capacity: 16, avatars: ['מא', 'תש'] },
    { id: '3', name: 'יוגה יין',     instructor: 'דניאל',   time: '18:00', duration: '60 דקות', studio: 'Studio A', img: 2, signups: 15, capacity: 20, avatars: ['רכ', 'יב'] },
  ] as ClassItem[],

  tomorrowClasses: [
    { id: '4', name: 'פלואו בוקר', instructor: 'אוליביה', time: '8:00', duration: '60 דקות', studio: 'Studio A', img: 3, signups: 6, capacity: 20, avatars: ['אל', 'דה'] },
  ] as ClassItem[],

  bookings: [
    { id: '1', name: 'ויניאסה פלואו', date: 'יום ג׳, 20 במאי', time: '9:00',  instructor: 'אוליביה', studio: 'Studio A', signups: 12, capacity: 20, avatars: ['אכ', 'נל'] },
    { id: '2', name: 'יוגה משקמת',   date: 'יום ה׳, 22 במאי', time: '18:30', instructor: 'סופיה',   studio: 'Studio B', signups: 8,  capacity: 16, avatars: ['מא', 'תש'] },
  ] as BookingItem[],

  user: { name: "ג'סיקה טיילור", email: 'jessica.taylor@email.com', initials: 'JT' },
} as const;
