import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  limitToLast,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { database } from './config';

/**
 * Write data to a Firebase Realtime Database path
 */
export const writeData = async <T>(path: string, data: T): Promise<void> => {
  try {
    await set(ref(database, path), data);
  } catch (error) {
    console.error(`Error writing to ${path}:`, error);
    throw error;
  }
};

/**
 * Read data once from a Firebase Realtime Database path
 */
export const readData = async <T>(path: string): Promise<T | null> => {
  try {
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      return snapshot.val() as T;
    }
    return null;
  } catch (error) {
    console.error(`Error reading from ${path}:`, error);
    throw error;
  }
};

/**
 * Update data at a Firebase Realtime Database path (merge operation)
 */
export const updateData = async <T extends Record<string, any>>(
  path: string,
  updates: Partial<T>
): Promise<void> => {
  try {
    await update(ref(database, path), updates as Record<string, any>);
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    throw error;
  }
};

/**
 * Delete data from a Firebase Realtime Database path
 */
export const deleteData = async (path: string): Promise<void> => {
  try {
    await remove(ref(database, path));
  } catch (error) {
    console.error(`Error deleting from ${path}:`, error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates from a Firebase Realtime Database path
 */
export const subscribeToData = <T>(
  path: string,
  callback: (data: T | null) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  const dbRef = ref(database, path);

  const unsubscribe = onValue(
    dbRef,
    (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as T);
      } else {
        callback(null);
      }
    },
    (error: any) => {
      console.error(`Error subscribing to ${path}:`, error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return unsubscribe;
};

/**
 * Subscribe to ordered data (latest items first)
 */
export const subscribeToOrderedData = <T extends Record<string, any>>(
  path: string,
  childKey: string,
  limitCount: number = 50,
  callback: (data: T[] | null) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  const dbRef = ref(database, path);
  const q = query(
    dbRef,
    orderByChild(childKey),
    limitToLast(limitCount)
  );

  const unsubscribe = onValue(
    q,
    (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, T>;
        // Convert object to array and reverse to get latest first
        const array = Object.keys(data)
          .map((key) => ({ ...data[key], id: key }))
          .reverse();
        callback(array);
      } else {
        callback(null);
      }
    },
    (error: any) => {
      console.error(`Error subscribing to ordered data at ${path}:`, error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return unsubscribe;
};

/**
 * Batch write multiple paths
 */
export const batchWrite = async <T>(
  updates: Record<string, T>
): Promise<void> => {
  try {
    const rootRef = ref(database);
    await update(rootRef, updates as Record<string, any>);
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
};

/**
 * Create a new document with auto-generated ID
 */
export const addDocument = async <T extends Record<string, any>>(
  path: string,
  data: T
): Promise<string> => {
  try {
    const newRef = ref(database, `${path}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
    const documentId = newRef.key || '';
    await set(newRef, {
      ...data,
      createdAt: new Date().toISOString(),
      id: documentId,
    });
    return documentId;
  } catch (error) {
    console.error(`Error adding document to ${path}:`, error);
    throw error;
  }
};
