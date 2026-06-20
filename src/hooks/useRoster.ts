import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface RosterEntry {
  bookingId: string;
  clientName: string;
  status: 'confirmed' | 'waitlist';
  attended: boolean;
}

export function useRoster(classId: string) {
  const [data, setData] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .rpc('get_class_roster', { p_class_id: classId })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setData(
          (rows ?? []).map((r: any) => ({
            bookingId: r.booking_id,
            clientName: r.client_name ?? '',
            status: r.status as 'confirmed' | 'waitlist',
            attended: r.attended ?? false,
          }))
        );
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [classId, version]);

  return { data, loading, error, refetch };
}
