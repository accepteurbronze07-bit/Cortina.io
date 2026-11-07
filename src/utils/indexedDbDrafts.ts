/**
 * IndexedDB Offline Script Drafts Storage & Online Synchronizer
 * Enables creators to write, save, and keep scripts locally in browser IndexedDB
 * even without an internet connection, and automatically syncs with the server when reconnected.
 */

export interface OfflineScriptDraft {
  id: string;
  topic: string;
  narrativeStyle: string;
  fullScript: string;
  hashtags: string[];
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  syncStatus: 'local' | 'synced' | 'pending';
}

const DB_NAME = 'cortia_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'script_drafts';

// Initialize or open IndexedDB safely
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update a script draft locally in IndexedDB
 */
export async function saveDraftToIndexedDb(data: {
  id?: string;
  topic: string;
  narrativeStyle?: string;
  fullScript: string;
  hashtags?: string[];
}): Promise<OfflineScriptDraft> {
  const db = await openIndexedDb();
  const now = Date.now();
  const draftId = data.id || `draft_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const draft: OfflineScriptDraft = {
    id: draftId,
    topic: data.topic || 'Script sans titre',
    narrativeStyle: data.narrativeStyle || 'mystery_bottom',
    fullScript: data.fullScript,
    hashtags: data.hashtags || [],
    createdAt: now,
    updatedAt: now,
    synced: false,
    syncStatus: 'local',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // If draft already exists, preserve its createdAt
    const getReq = store.get(draftId);
    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.createdAt) {
        draft.createdAt = getReq.result.createdAt;
      }
      const putReq = store.put(draft);
      putReq.onsuccess = () => resolve(draft);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => {
      const putReq = store.put(draft);
      putReq.onsuccess = () => resolve(draft);
      putReq.onerror = () => reject(putReq.error);
    };
  });
}

/**
 * Retrieve all offline drafts sorted by most recently updated
 */
export async function getDraftsFromIndexedDb(): Promise<OfflineScriptDraft[]> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as OfflineScriptDraft[]) || [];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a draft from IndexedDB
 */
export async function deleteDraftFromIndexedDb(id: string): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Mark drafts as synced
 */
export async function markDraftsSyncedInIndexedDb(ids: string[]): Promise<void> {
  const db = await openIndexedDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const id of ids) {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.synced = true;
        item.syncStatus = 'synced';
        store.put(item);
      }
    };
  }
}

/**
 * Synchronize local IndexedDB drafts with server
 */
export async function syncOfflineDraftsWithServer(authToken?: string): Promise<{
  syncedCount: number;
  totalLocal: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, totalLocal: 0 };
  }

  const drafts = await getDraftsFromIndexedDb();
  const unsyncedDrafts = drafts.filter((d) => !d.synced);

  if (unsyncedDrafts.length === 0) {
    return { syncedCount: 0, totalLocal: drafts.length };
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch('/api/scripts/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ drafts: unsyncedDrafts }),
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.syncedIds)) {
      await markDraftsSyncedInIndexedDb(data.syncedIds);
      // Dispatch sync event for UI components to refresh
      window.dispatchEvent(
        new CustomEvent('cortia:drafts-synced', {
          detail: { syncedCount: data.syncedIds.length, total: drafts.length },
        })
      );
      return { syncedCount: data.syncedIds.length, totalLocal: drafts.length };
    }
  } catch (err) {
    console.warn('Drafts sync with server failed, will retry next time online:', err);
  }

  return { syncedCount: 0, totalLocal: drafts.length };
}
