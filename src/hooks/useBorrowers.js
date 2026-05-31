import { useCallback, useEffect, useState } from 'react';
import { listBorrowers } from '../lib/borrowers.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

export function useBorrowers(type) {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setBorrowers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listBorrowers({ type, activeOnly: true });
      setBorrowers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { borrowers, loading, error, reload };
}
