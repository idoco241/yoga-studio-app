import { createContext, useContext } from 'react';

export interface Translations {
  nav: { home: string; classes: string; bookings: string; profile: string; manage: string };
  tagline: string;
  welcome: string[];
  bookClass: string;
  classesThisWeek: string;
  viewAllBookings: string;
  classBooked: string;
  classBookedSub: (name: string) => string;
  classesTitle: string;
  classTabs: string[];
  book: string;
  with: (name: string) => string;
  bookingsTitle: string;
  cancel: string;
  reschedule: string;
  bookingCancelled: string;
  noBookings: string;
  noBookingsSub: string;
  browseClasses: string;
  profileTitle: string;
  profileMenu: string[];
  signIn: string;
  signUp: string;
  signOut: string;
  emailLabel: string;
  passwordLabel: string;
  displayNameLabel: string;
  noAccount: string;
  haveAccount: string;
  checkEmail: string;
  manageTitle: string;
  roster: string;
  attended: string;
  addClass: string;
  noManagedClasses: string;
  saveClass: string;
  classTitleLabel: string;
  categoryLabel: string;
  dateTimeLabel: string;
  durationLabel: string;
  capacityLabel: string;
  locationLabel: string;
  paymentReviewTitle: string;
  markCash: string;
  markWaived: string;
  requestPayment: string;
  paymentDone: string;
  payInstructor: string;
  payTitle: string;
  paySuccess: string;
}

export const translations: Translations = {
  nav: { home: 'Home', classes: 'Classes', bookings: 'Bookings', profile: 'Profile', manage: 'Manage' },
  tagline: 'Move. Breathe. Be.',
  welcome: ['Welcome to your space', 'for balance and well-being.'],
  bookClass: 'Book a Class',
  classesThisWeek: 'Your Classes This Week',
  viewAllBookings: 'View All Bookings',
  classBooked: 'Class booked!',
  classBookedSub: (name) => `You're registered for ${name}`,
  classesTitle: 'Classes',
  classTabs: ['All', 'Yoga', 'Meditation', 'Specialty'],
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
  signIn: 'Sign In',
  signUp: 'Sign Up',
  signOut: 'Sign Out',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  displayNameLabel: 'Full Name',
  noAccount: "Don't have an account?",
  haveAccount: 'Already have an account?',
  checkEmail: 'Check your email to confirm your account',
  manageTitle: 'Manage',
  roster: 'Roster',
  attended: 'Attended',
  addClass: 'Add Class',
  noManagedClasses: 'No upcoming classes',
  saveClass: 'Save Class',
  classTitleLabel: 'Class Title',
  categoryLabel: 'Category',
  dateTimeLabel: 'Date & Time',
  durationLabel: 'Duration (minutes)',
  capacityLabel: 'Max Capacity',
  locationLabel: 'Location',
  paymentReviewTitle: 'Payment Review',
  markCash: 'Cash',
  markWaived: 'Waived',
  requestPayment: 'Request',
  paymentDone: 'Done',
  payInstructor: 'Your instructor will collect payment directly',
  payTitle: 'Payment',
  paySuccess: 'Payment received — thank you!',
};

export interface LocaleContextValue {
  t: Translations;
}

export const LocaleContext = createContext<LocaleContextValue>({ t: translations });

export const useLocale = () => useContext(LocaleContext);
