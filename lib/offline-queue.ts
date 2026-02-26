import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SyncMutation } from './sync';

const QUEUE_KEY = '@offline_queue';
let hasWarnedStorageUnavailable = false;

function isStorageUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Native module is null|legacy storage/i.test(error.message);
}

function warnStorageUnavailableOnce() {
  if (hasWarnedStorageUnavailable) return;
  hasWarnedStorageUnavailable = true;
  console.warn('Offline queue storage is unavailable in this runtime. Continuing without persistence.');
}

export interface QueuedMutation extends SyncMutation {
  id: string;
  timestamp: number;
}

// Platform-specific storage helpers
async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return AsyncStorage.getItem(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set localStorage:', error);
    }
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove localStorage:', error);
    }
    return;
  }
  await AsyncStorage.removeItem(key);
}

export async function addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<string> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    const queue = await getQueue();
    const queuedMutation: QueuedMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
    };

    queue.push(queuedMutation);
    await setStorageItem(QUEUE_KEY, JSON.stringify(queue));
    return id;
  } catch (error) {
    if (isStorageUnavailable(error)) {
      warnStorageUnavailableOnce();
      return id;
    }

    console.warn('Failed to add to queue:', error);
    throw error;
  }
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const data = await getStorageItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    if (isStorageUnavailable(error)) {
      warnStorageUnavailableOnce();
      return [];
    }

    console.warn('Failed to get queue:', error);
    return [];
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await setStorageItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    if (isStorageUnavailable(error)) {
      warnStorageUnavailableOnce();
      return;
    }

    console.warn('Failed to remove from queue:', error);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    await removeStorageItem(QUEUE_KEY);
  } catch (error) {
    if (isStorageUnavailable(error)) {
      warnStorageUnavailableOnce();
      return;
    }

    console.warn('Failed to clear queue:', error);
  }
}

export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
