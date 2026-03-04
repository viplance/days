import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Cycle } from '../types/cycle.type';

const CYCLE_KEY = 'days_cycles';
const CONGRATS_KEY = 'days_congrats_seen';
const LANGUAGE_KEY = 'days_language';
const CYCLE_LENGTH_KEY = 'days_cycle_length';

let iCloudStorage: any = null;
if (Platform.OS === 'ios') {
  try {
    iCloudStorage = require('expo-icloud-storage').default;
  } catch (e) {
    console.warn('Expo iCloud Storage not found', e);
  }
}

const storageGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'ios' && iCloudStorage) {
    try {
      const value = iCloudStorage.getString(key);
      if (value) {
        return value;
      }
      // Migration: Check AsyncStorage if iCloud is empty
      const localValue = await AsyncStorage.getItem(key);
      if (localValue) {
        iCloudStorage.set(key, localValue);
        return localValue;
      }
    } catch (e) {
      console.warn('iCloud storage get error', e);
      return AsyncStorage.getItem(key);
    }
  }
  return AsyncStorage.getItem(key);
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'ios' && iCloudStorage) {
    try {
      iCloudStorage.set(key, value);
      // Optional: keep local storage in sync implies double write, 
      // but strictly we want to rely on iCloud for iOS. 
      // We can also update AsyncStorage to be safe.
      AsyncStorage.setItem(key, value);
      return;
    } catch (e) {
      console.warn('iCloud storage set error', e);
    }
  }
  return AsyncStorage.setItem(key, value);
};

export const Storage = {
  async getCycles(): Promise<Cycle[]> {
    try {
      const data = await storageGet(CYCLE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load cycles', e);
      return [];
    }
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    if (!cycle.startDate) {
      console.warn('Attempted to save cycle without startDate', cycle);
      return;
    }
    const cycles = await this.getCycles();
    const existingIndex = cycles.findIndex((c) => c.id === cycle.id);
    if (existingIndex >= 0) {
      cycles[existingIndex] = cycle;
    } else {
      cycles.push(cycle);
    }
    await storageSet(CYCLE_KEY, JSON.stringify(cycles));
  },

  async saveCycles(cycles: Cycle[]): Promise<void> {
    await storageSet(CYCLE_KEY, JSON.stringify(cycles));
  },

  async deleteCycle(id: string): Promise<void> {
    const cycles = await this.getCycles();
    const updatedCycles = cycles.filter((c) => c.id !== id);
    await this.saveCycles(updatedCycles);
  },

  async getLanguage(): Promise<string | null> {
    return await storageGet(LANGUAGE_KEY);
  },

  async setLanguage(lang: string): Promise<void> {
    await storageSet(LANGUAGE_KEY, lang);
  },

  async hasSeenCongrats(): Promise<boolean> {
    const val = await storageGet(CONGRATS_KEY);
    return val === 'true';
  },

  async setSeenCongrats(): Promise<void> {
    await storageSet(CONGRATS_KEY, 'true');
  },

  async getCycleLength(): Promise<number | null> {
    const val = await storageGet(CYCLE_LENGTH_KEY);
    return val ? parseInt(val, 10) : null;
  },

  async setCycleLength(length: number): Promise<void> {
    await storageSet(CYCLE_LENGTH_KEY, length.toString());
  },
};
