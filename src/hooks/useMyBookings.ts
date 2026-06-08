import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MyBooking {
  id: string;
  classId: string;
  status: 'confirmed' | 'waitlist';
  title: string;
  instructor: string;
  scheduledAt: Date;
  durationMinutes: number;
  location: string | null;
}

export function useMyBookings() {
  const [data, setData] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from('bookings')
      .select(`
        id, class_id, status,
        classes(title, scheduled_at, duration_minutes, location,
          profiles!instructor_id(display_name))
      `)
      .in('status', ['confirmed', 'waitlist'])
      .order('created_at', { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }

    const bookings: MyBooking[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      classId: row.class_id,
      status: row.status,
      title: row.classes?.title ?? '',
      instructor: row.classes?.profiles?.display_name ?? '',
      scheduledAt: new Date(row.classes?.scheduled_at),
      durationMinutes: row.classes?.duration_minutes ?? 0,
      location: row.classes?.location ?? null,
    })).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    setData(bookings);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
