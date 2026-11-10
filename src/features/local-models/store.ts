/**
 * IndexedDB persistence: the chosen folder handle (File System Access handles
 * are structured-cloneable) and the inventory of models in that folder.
 */

export type InventoryState = "stored" | "runnable";

export type InventoryItem = {
  /** Folder name inside the library root; primary key. */
  folder: string;
  repo: string;
  revision: string;
  variant: string | null;
  format: "gguf" | "safetensors";
  totalBytes: number;
  complete: boolean;
  /** "Almacenado" = files on disk; "Ejecutable" = Ollama has it registered. */
  state: InventoryState;
  ollamaName: string | null;
  updatedAt: string;
};

const DB_NAME = "amaru-local-models";
const DB_VERSION = 1;
const HANDLES = "handles";
const INVENTORY = "inventory";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no está disponible en este navegador."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLES)) db.createObjectStore(HANDLES);
      if (!db.objectStoreNames.contains(INVENTORY))
        db.createObjectStore(INVENTORY, { keyPath: "folder" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = action(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result as T);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  return run<FileSystemDirectoryHandle | undefined>(HANDLES, "readonly", (s) =>
    s.get("root"),
  ).then((value) => value ?? null);
}

export function saveRootHandle(handle: FileSystemDirectoryHandle) {
  return run(HANDLES, "readwrite", (s) => s.put(handle, "root"));
}

export function forgetRootHandle() {
  return run(HANDLES, "readwrite", (s) => s.delete("root"));
}

export function listInventory(): Promise<InventoryItem[]> {
  return run<InventoryItem[]>(INVENTORY, "readonly", (s) => s.getAll());
}

export function putInventory(item: InventoryItem) {
  return run(INVENTORY, "readwrite", (s) => s.put(item));
}

export function deleteInventory(folder: string) {
  return run(INVENTORY, "readwrite", (s) => s.delete(folder));
}
