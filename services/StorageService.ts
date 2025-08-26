import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  themeMode: 'system' | 'light' | 'dark';
  selectedCurrency: string;
}

const STORAGE_KEYS = {
  SETTINGS: '@contribution_tracker_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  selectedCurrency: 'USD',
};

class StorageService {
  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        // Ensure all required properties exist with defaults
        return {
          ...DEFAULT_SETTINGS,
          ...settings,
        };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async updateThemeMode(themeMode: 'system' | 'light' | 'dark'): Promise<void> {
    await this.saveSettings({ themeMode });
  }

  async updateCurrency(currency: string): Promise<void> {
    await this.saveSettings({ selectedCurrency: currency });
  }

  // Migration helper for existing users
  async migrateOldSettings(): Promise<void> {
    try {
      // Check if we have old individual keys (for migration)
      const oldTheme = await AsyncStorage.getItem('@theme_mode');
      const oldCurrency = await AsyncStorage.getItem('@selected_currency');
      
      if (oldTheme || oldCurrency) {
        const settings: Partial<AppSettings> = {};
        
        if (oldTheme) {
          settings.themeMode = oldTheme === 'dark' ? 'dark' : 'light';
          await AsyncStorage.removeItem('@theme_mode');
        }
        
        if (oldCurrency) {
          settings.selectedCurrency = oldCurrency;
          await AsyncStorage.removeItem('@selected_currency');
        }
        
        await this.saveSettings(settings);
      }
    } catch (error) {
      console.error('Failed to migrate old settings:', error);
    }
  }
}

export const Storage = new StorageService();