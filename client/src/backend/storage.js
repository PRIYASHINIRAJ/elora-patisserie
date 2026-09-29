// Browser persistence (IndexedDB): the SQLite database file and uploaded files.
// Everything lives on the visitor's own device — there is no server.

const DB_NAME = 'elora-patisserie';
const STORES = ['kv', 'files'];

let dbPromise;
function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => STORES.forEach((s) => req.result.objectStoreNames.contains(s) || req.result.createObjectStore(s));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const getItem = (store, key) => tx(store, 'readonly', (s) => s.get(key));
export const setItem = (store, key, value) => tx(store, 'readwrite', (s) => s.put(value, key));
export const deleteItem = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));

// ---- Uploaded files ------------------------------------------------------
// Stored as Blobs and referenced in the database as `local-file:<id>`; the API
// layer swaps those for object URLs the page can display.

export const FILE_PREFIX = 'local-file:';

export async function saveFile(file) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await setItem('files', id, file);
  return `${FILE_PREFIX}${id}`;
}

export async function removeFile(url) {
  if (url?.startsWith(FILE_PREFIX)) await deleteItem('files', url.slice(FILE_PREFIX.length));
}

const objectUrls = new Map();
export async function resolveFileUrl(url) {
  const id = url.slice(FILE_PREFIX.length);
  if (!objectUrls.has(id)) {
    const blob = await getItem('files', id);
    objectUrls.set(id, blob ? URL.createObjectURL(blob) : '');
  }
  return objectUrls.get(id);
}
