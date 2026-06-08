export interface UpcomingClass {
  date: string;
  time: string;
  name: string;
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

  bookings: [
    { id: '1', name: 'Vinyasa Flow',     date: 'Tue, May 20', time: '9:00 AM',  instructor: 'Olivia', studio: 'Studio A', signups: 12, capacity: 20, avatars: ['EC', 'NL'] },
    { id: '2', name: 'Restorative Yoga', date: 'Thu, May 22', time: '6:30 PM',  instructor: 'Sophia', studio: 'Studio B', signups: 8,  capacity: 16, avatars: ['MA', 'TS'] },
  ] as BookingItem[],

  user: { name: 'Jessica Taylor', email: 'jessica.taylor@email.com', initials: 'JT' },
} as const;
