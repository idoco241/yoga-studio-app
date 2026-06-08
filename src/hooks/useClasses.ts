import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ClassRow {
  id: string;
  title: string;
  instructor: string;
  scheduledAt: Date;
  durationMinutes: number;
  maxCapacity: number;
  location: string | null;
  category: string;
}

export function useClasses(date: Date, category?: string) {
  const dateKey = date.toDateString();
  const [data, setData] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    let query = supabase
      .from('classes')
      .select(
        'id, title, scheduled_at, duration_minutes, max_capacity, location, category, instructor:profiles!instructor_id(display_name)'
      )
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    query.then(({ data: rows, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setData(
        (rows ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          instructor: (row.instructor as any)?.display_name ?? '',
          scheduledAt: new Date(row.scheduled_at),
          durationMinutes: row.duration_minutes,
          maxCapacity: row.max_capacity,
          location: row.location ?? null,
          category: row.category,
        }))
      );
      setLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, category]);

  return { data, loading, error };
}
