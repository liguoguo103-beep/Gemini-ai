

export interface MediaRecord {
  id: number;
  profileId: string;
  prompt: string;
  aspectRatio: string;
  blob: Blob;
  createdAt: Date;
}

export interface CodeRecord {
  id: number;
  profileId: string;
  prompt: string;
  language: string;
  code: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: Date;
}

const DB_NAME = 'GeminiLiteDB';
const DB_VERSION = 3; // Incremented version to add code store
export const IMAGE_STORE = 'images';
export const VIDEO_STORE = 'videos';
export const CODE_STORE = 'code';
export const PROFILE_STORE = 'profiles';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject("Error opening DB");
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      const setupStore = (storeName: string) => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
          const store = dbInstance.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('profileId', 'profileId', { unique: false });
        } else {
          const store = request.transaction!.objectStore(storeName);
          if (!store.indexNames.contains('profileId')) {
            store.createIndex('profileId', 'profileId', { unique: false });
          }
        }
      };

      setupStore(IMAGE_STORE);
      setupStore(VIDEO_STORE);
      setupStore(CODE_STORE);
      
      if (!dbInstance.objectStoreNames.contains(PROFILE_STORE)) {
        dbInstance.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Profile Management
export const addProfile = async (profile: Profile): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(PROFILE_STORE, 'readwrite');
    const store = transaction.objectStore(PROFILE_STORE);
    store.add(profile);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getAllProfiles = async (): Promise<Profile[]> => {
    const db = await initDB();
    const transaction = db.transaction(PROFILE_STORE, 'readonly');
    const store = transaction.objectStore(PROFILE_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
        request.onerror = () => reject(request.error);
    });
};

export const updateProfile = async (profile: Profile): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(PROFILE_STORE, 'readwrite');
    const store = transaction.objectStore(PROFILE_STORE);
    store.put(profile);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const deleteProfile = async (profileId: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction([PROFILE_STORE, IMAGE_STORE, VIDEO_STORE, CODE_STORE], 'readwrite');
    
    // Delete profile
    transaction.objectStore(PROFILE_STORE).delete(profileId);

    // Delete associated media
    const stores = [IMAGE_STORE, VIDEO_STORE, CODE_STORE];
    stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const index = store.index('profileId');
        const request = index.openCursor(IDBKeyRange.only(profileId));
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};


// Media Management
export const addMedia = async (storeName: string, media: Omit<MediaRecord, 'id' | 'createdAt'>): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const record = { // Don't include ID here for auto-increment
        ...media,
        createdAt: new Date(),
    }
    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error adding media:", request.error);
      reject(request.error);
    };
  });
};

export const getAllMedia = async (storeName: string, profileId: string): Promise<MediaRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('profileId');
    const request = index.getAll(profileId);

    request.onsuccess = () => {
        const sorted = request.result.sort((a, b) => b.id - a.id);
        resolve(sorted);
    };
    request.onerror = () => {
      console.error("Error getting all media:", request.error);
      reject(request.error);
    };
  });
};

// Code Management
export const addCode = async (code: Omit<CodeRecord, 'id' | 'createdAt'>): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CODE_STORE, 'readwrite');
    const store = transaction.objectStore(CODE_STORE);
    const record = { ...code, createdAt: new Date() };
    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error adding code:", request.error);
      reject(request.error);
    };
  });
};

export const getAllCode = async (profileId: string): Promise<CodeRecord[]> => {
  const db = await initDB();
  const transaction = db.transaction(CODE_STORE, 'readonly');
  const store = transaction.objectStore(CODE_STORE);
  const index = store.index('profileId');
  const request = index.getAll(profileId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.id - a.id));
    request.onerror = () => reject(request.error);
  });
};


export const deleteMedia = async (storeName: string, id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error deleting media:", request.error);
      reject(request.error);
    };
  });
};