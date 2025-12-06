import { useState, useEffect, useCallback } from 'react';

// Types
export interface CachedScanData {
  id: string;
  uniqueId: string;
  name: string;
  department?: string;
  timestamp: number;
  synced: boolean;
}

export interface PWAStorageState {
  isOnline: boolean;
  isStorageSupported: boolean;
  lastSyncTime: number | null;
  pendingSyncCount: number;
}

// Hook for PWA Storage and Offline Caching
export const usePWAStorage = () => {
  const [storageState, setStorageState] = useState<PWAStorageState>({
    isOnline: navigator.onLine,
    isStorageSupported: typeof Storage !== 'undefined',
    lastSyncTime: null,
    pendingSyncCount: 0
  });

  const [cachedScans, setCachedScans] = useState<CachedScanData[]>([]);

  // Check if online status changes
  useEffect(() => {
    const handleOnline = () => {
      setStorageState(prev => ({
        ...prev,
        isOnline: true
      }));
    };

    const handleOffline = () => {
      setStorageState(prev => ({
        ...prev,
        isOnline: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached scans from localStorage
  const loadCachedScans = useCallback(() => {
    if (!storageState.isStorageSupported) return;

    try {
      const cachedData = localStorage.getItem('cached_scans');
      if (cachedData) {
        const parsedData: CachedScanData[] = JSON.parse(cachedData);
        setCachedScans(parsedData);
        
        // Update pending sync count
        const pendingCount = parsedData.filter(scan => !scan.synced).length;
        setStorageState(prev => ({
          ...prev,
          pendingSyncCount: pendingCount
        }));
      }
    } catch (error) {
      console.error('Failed to load cached scans:', error);
    }
  }, [storageState.isStorageSupported]);

  // Save cached scans to localStorage
  const saveCachedScans = useCallback((scans: CachedScanData[]) => {
    if (!storageState.isStorageSupported) return;

    try {
      localStorage.setItem('cached_scans', JSON.stringify(scans));
      
      // Update pending sync count
      const pendingCount = scans.filter(scan => !scan.synced).length;
      setStorageState(prev => ({
        ...prev,
        pendingSyncCount: pendingCount
      }));
    } catch (error) {
      console.error('Failed to save cached scans:', error);
    }
  }, [storageState.isStorageSupported]);

  // Add a new scan to cache
  const cacheScan = useCallback((scanData: Omit<CachedScanData, 'id' | 'timestamp' | 'synced'>) => {
    if (!storageState.isStorageSupported) return null;

    try {
      const newScan: CachedScanData = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...scanData,
        timestamp: Date.now(),
        synced: false
      };

      const updatedScans = [...cachedScans, newScan];
      setCachedScans(updatedScans);
      saveCachedScans(updatedScans);
      
      return newScan;
    } catch (error) {
      console.error('Failed to cache scan:', error);
      return null;
    }
  }, [cachedScans, saveCachedScans, storageState.isStorageSupported]);

  // Mark a scan as synced
  const markScanAsSynced = useCallback((scanId: string) => {
    if (!storageState.isStorageSupported) return;

    try {
      const updatedScans = cachedScans.map(scan => 
        scan.id === scanId ? { ...scan, synced: true } : scan
      );
      
      setCachedScans(updatedScans);
      saveCachedScans(updatedScans);
      
      setStorageState(prev => ({
        ...prev,
        lastSyncTime: Date.now()
      }));
    } catch (error) {
      console.error('Failed to mark scan as synced:', error);
    }
  }, [cachedScans, saveCachedScans, storageState.isStorageSupported]);

  // Remove a scan from cache
  const removeScanFromCache = useCallback((scanId: string) => {
    if (!storageState.isStorageSupported) return;

    try {
      const updatedScans = cachedScans.filter(scan => scan.id !== scanId);
      setCachedScans(updatedScans);
      saveCachedScans(updatedScans);
    } catch (error) {
      console.error('Failed to remove scan from cache:', error);
    }
  }, [cachedScans, saveCachedScans, storageState.isStorageSupported]);

  // Clear all cached scans
  const clearCachedScans = useCallback(() => {
    if (!storageState.isStorageSupported) return;

    try {
      setCachedScans([]);
      localStorage.removeItem('cached_scans');
      
      setStorageState(prev => ({
        ...prev,
        pendingSyncCount: 0
      }));
    } catch (error) {
      console.error('Failed to clear cached scans:', error);
    }
  }, [storageState.isStorageSupported]);

  // Sync pending scans with backend
  const syncPendingScans = useCallback(async (syncFunction: (uniqueId: string) => Promise<boolean>) => {
    if (!storageState.isStorageSupported || storageState.isOnline === false) return;

    try {
      const pendingScans = cachedScans.filter(scan => !scan.synced);
      
      if (pendingScans.length === 0) {
        setStorageState(prev => ({
          ...prev,
          lastSyncTime: Date.now()
        }));
        return;
      }

      let syncedCount = 0;
      const updatedScans = [...cachedScans];

      for (const scan of pendingScans) {
        try {
          const success = await syncFunction(scan.uniqueId);
          if (success) {
            const index = updatedScans.findIndex(s => s.id === scan.id);
            if (index !== -1) {
              updatedScans[index] = { ...scan, synced: true };
              syncedCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to sync scan ${scan.id}:`, error);
        }
      }

      if (syncedCount > 0) {
        setCachedScans(updatedScans);
        saveCachedScans(updatedScans);
        
        setStorageState(prev => ({
          ...prev,
          lastSyncTime: Date.now(),
          pendingSyncCount: prev.pendingSyncCount - syncedCount
        }));
      }
    } catch (error) {
      console.error('Failed to sync pending scans:', error);
    }
  }, [cachedScans, saveCachedScans, storageState.isStorageSupported, storageState.isOnline]);

  // Initialize on mount
  useEffect(() => {
    loadCachedScans();
  }, [loadCachedScans]);

  return {
    storageState,
    cachedScans,
    cacheScan,
    markScanAsSynced,
    removeScanFromCache,
    clearCachedScans,
    syncPendingScans
  };
};