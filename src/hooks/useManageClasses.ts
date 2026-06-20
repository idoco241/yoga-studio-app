import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface ManagedClass {
  id: string;
  title: string;
  category: string;
  scheduledAt: Date;
  durationMinutes: number;
  maxCapacity: number;
  location: string | null;
  instructorName: string;
  confirmedCount: number;
  waitlistCount: number;
}

export function useManageClasses() {
  const [data, setData] = useState<ManagedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 14);

    supabase
      .rpc('get_managed_classes', {
        p_start_ts: start.toISOString(),
        p_end_ts: end.toISOString(),
      })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setData(
          (rows ?? []).map((r: any) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            scheduledAt: new Date(r.scheduled_at),
            durationMinutes: r.duration_minutes,
            maxCapacity: r.max_capacity,
            location: r.location ?? null,
            instructorName: r.instructor_name ?? '',
            confirmedCount: r.confirmed_count ?? 0,
            waitlistCount: r.waitlist_count ?? 0,
          }))
        );
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [version]);

  return { data, loading, error, refetch };
}
