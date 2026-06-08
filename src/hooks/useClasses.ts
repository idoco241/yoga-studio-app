import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ClassRow {
  id: string;
  title: string;
  description: string | null;
  instructor: string;
  scheduledAt: Date;
  durationMinutes: number;
  maxCapacity: number;
  category: string;
  confirmedCount: number;
  myBookingId: string | null;
  myBookingStatus: 'confirmed' | 'waitlist' | 'cancelled' | null;
}

export function useClasses(date: Date, category?: string) {
  const dateKey = date.toDateString();
  const [data, setData] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    supabase
      .rpc('get_classes_for_date', {
        start_ts: start.toISOString(),
        end_ts: end.toISOString(),
      })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }

        let classes: ClassRow[] = (rows ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description ?? null,
          instructor: row.instructor_name ?? '',
          scheduledAt: new Date(row.scheduled_at),
          durationMinutes: row.duration_minutes,
          maxCapacity: row.max_capacity,
          category: row.category,
          confirmedCount: row.confirmed_count ?? 0,
          myBookingId: row.my_booking_id ?? null,
          myBookingStatus: row.my_booking_status ?? null,
        }));

        if (category && category !== 'all') {
          classes = classes.filter((c) => c.category === category);
        }

        setData(classes);
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, category, version]);

  return { data, loading, error, refetch };
}
