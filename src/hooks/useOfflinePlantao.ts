import { useEffect, useState, useCallback } from 'react';

interface OfflineData {
  calendarNotes: any[];
  messages: any[];
  shiftSchedule: any | null;
  lastSync: string | null;
}

const STORAGE_KEY = 'plantao_offline_data';

export const useOfflinePlantao = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      calendarNotes: [],
      messages: [],
      shiftSchedule: null,
      lastSync: null
    };
  });
  const [pendingSync, setPendingSync] = useState<any[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist offline data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineData));
  }, [offlineData]);

  // Save data for offline access
  const cacheData = useCallback((key: keyof OfflineData, data: any) => {
    setOfflineData(prev => ({
      ...prev,
      [key]: data,
      lastSync: new Date().toISOString()
    }));
  }, []);

  // Queue data for sync when online
  const queueForSync = useCallback((action: string, data: any) => {
    const syncItem = {
      id: Date.now().toString(),
      action,
      data,
      timestamp: new Date().toISOString()
    };

    setPendingSync(prev => [...prev, syncItem]);
    
    // Also store in localStorage for persistence
    const stored = localStorage.getItem('plantao_pending_sync');
    const pending = stored ? JSON.parse(stored) : [];
    localStorage.setItem('plantao_pending_sync', JSON.stringify([...pending, syncItem]));
  }, []);

  // Sync pending data when online
  const syncPendingData = useCallback(async () => {
    if (!isOnline) return;

    const stored = localStorage.getItem('plantao_pending_sync');
    const pending = stored ? JSON.parse(stored) : [];

    if (pending.length === 0) return;

    // Process each pending item
    for (const item of pending) {
      try {
        // Here you would actually sync with Supabase
        console.log('Syncing:', item);
        // await supabase.from(item.table).insert/update/delete(item.data);
      } catch (error) {
        console.error('Sync error:', error);
        // Keep failed items in queue
        continue;
      }
    }

    // Clear synced items
    localStorage.removeItem('plantao_pending_sync');
    setPendingSync([]);
  }, [isOnline]);

  // Get cached data
  const getCachedData = useCallback((key: keyof OfflineData) => {
    return offlineData[key];
  }, [offlineData]);

  return {
    isOnline,
    offlineData,
    cacheData,
    queueForSync,
    syncPendingData,
    getCachedData,
    pendingSyncCount: pendingSync.length,
    lastSync: offlineData.lastSync
  };
};

export default useOfflinePlantao;
