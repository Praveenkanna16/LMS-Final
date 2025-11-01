import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom hook for synchronizing batch data across Admin, Teacher, and Student dashboards
 */
export function useBatchSync(enabled = true, intervalMs = 30000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

  const syncBatchData = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['batches'] });
      await queryClient.invalidateQueries({ queryKey: ['myBatches'] });
      await queryClient.invalidateQueries({ queryKey: ['teacherBatches'] });
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });

      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error('Failed to sync batch data:', error);
    }
  }, [queryClient]);

  const forceSyncNow = useCallback(async () => {
    await syncBatchData();
    toast.success('Data refreshed successfully', {
      duration: 2000,
      position: 'bottom-right',
    });
  }, [syncBatchData]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      void syncBatchData();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, syncBatchData]);

  return {
    syncNow: forceSyncNow,
    lastSyncTime: lastSyncRef.current,
  };
}

/**
 * Trigger a batch update event across all tabs and dashboards
 */
export function triggerBatchUpdate() {
  localStorage.setItem('batch_updated', Date.now().toString());
  window.dispatchEvent(
    new CustomEvent('batchDataChanged', {
      detail: { timestamp: Date.now() },
    })
  );
}

/**
 * Hook to listen for batch update events
 */
export function useBatchUpdateListener(callback: () => void) {
  useEffect(() => {
    const handleBatchUpdate = () => {
      callback();
    };

    window.addEventListener('batchDataChanged', handleBatchUpdate);
    return () => {
      window.removeEventListener('batchDataChanged', handleBatchUpdate);
    };
  }, [callback]);
}
