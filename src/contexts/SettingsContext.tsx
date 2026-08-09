import React, { createContext, useContext, useEffect, useState } from 'react';
import { GymSettings } from '../types';
import { DEFAULT_SETTINGS, db } from '../database/db';

interface SettingsContextType {
  settings: GymSettings;
  updateSettings: (newSettings: Partial<GymSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const LOCAL_STORAGE_SETTINGS_KEY = 'gym_app_settings_v1';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GymSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Sync settings with Dexie DB on startup and when updated
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const dbSettings = await db.settings.get('config');
        if (dbSettings) {
          setSettings(prev => {
            const merged = { ...prev, ...dbSettings };
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(merged));
            return merged;
          });
        } else {
          // Initialize DB with default
          await db.settings.put({ ...settings, key: 'config' } as any);
        }
      } catch (err) {
        console.error('Failed to load settings from db:', err);
      }
    };
    loadFromDb();
  }, []);

  // Handle dark mode DOM class toggling
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const updateSettings = async (newSettings: Partial<GymSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      await db.settings.put({ ...updated, key: 'config' } as any);
    } catch (err) {
      console.error('Failed to update settings in db:', err);
    }
  };

  const resetAllData = async () => {
    await db.payments.clear();
    await db.members.clear();
    await db.settings.clear();
    localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetAllData }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
