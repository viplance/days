import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Cycle {
  id: string;
  startDate: string;
  endDate?: string;
}

const CYCLE_KEY = 'days_cycles';
const CONGRATS_KEY = 'days_congrats_seen';
const LANGUAGE_KEY = 'days_language';

export const Storage = {
  async getCycles(): Promise<Cycle[]> {
    try {
      const data = await AsyncStorage.getItem(CYCLE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load cycles', e);
      return [];
    }
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    const cycles = await this.getCycles();
    const existingIndex = cycles.findIndex((c) => c.id === cycle.id);
    if (existingIndex >= 0) {
      cycles[existingIndex] = cycle;
    } else {
      cycles.push(cycle);
    }
    await AsyncStorage.setItem(CYCLE_KEY, JSON.stringify(cycles));
  },

  async saveCycles(cycles: Cycle[]): Promise<void> {
    await AsyncStorage.setItem(CYCLE_KEY, JSON.stringify(cycles));
  },

  async getLanguage(): Promise<string | null> {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  },

  async setLanguage(lang: string): Promise<void> {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  },

  async hasSeenCongrats(): Promise<boolean> {
    const val = await AsyncStorage.getItem(CONGRATS_KEY);
    return val === 'true';
  },

  async setSeenCongrats(): Promise<void> {
    await AsyncStorage.setItem(CONGRATS_KEY, 'true');
  },
};
