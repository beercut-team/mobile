import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { getQueue, removeFromQueue, getQueueCount } from '@/lib/offline-queue';
import { pushSync } from '@/lib/sync';
import type { QueuedMutation } from '@/lib/offline-queue';
import { useToast } from '@/contexts/toast-context';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updatePendingCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncing) return;

    const queue = await getQueue();
    if (queue.length === 0) {
      await updatePendingCount();
      return;
    }

    setIsSyncing(true);

    try {
      // Convert QueuedMutation to SyncMutation format
      const mutations = queue.map(({ id, timestamp, ...mutation }) => mutation);

      await pushSync({ mutations });

      // Remove synced mutations from queue
      await Promise.all(queue.map(item => removeFromQueue(item.id)));

      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();

      await updatePendingCount();
      showToast(`Синхронизировано ${queue.length} изменений`, 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast('Ошибка синхронизации', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queryClient, showToast, updatePendingCount]);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);

      // Auto-sync when connection is restored
      if (online) {
        syncQueue();
      }
    });

    // Initial sync check
    updatePendingCount();

    return () => {
      unsubscribe();
    };
  }, [syncQueue, updatePendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncQueue,
    updatePendingCount,
  };
}
