import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Database } from '@/services/Database';
import { Group, Participant, Contribution } from '@/types';
import { Alert } from 'react-native';

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Currency
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  
  // Data
  groups: Group[];
  participants: Participant[];
  contributions: Contribution[];
  
  // Loading states
  isLoading: boolean;
  
  // Methods
  refreshData: () => Promise<void>;
  addGroup: (group: Omit<Group, 'id'>) => Promise<void>;
  updateGroup: (id: number, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  addParticipant: (participant: Omit<Participant, 'id'>) => Promise<void>;
  updateParticipant: (id: number, participant: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: number) => Promise<void>;
  addContribution: (contribution: Omit<Contribution, 'id'>) => Promise<void>;
  updateContribution: (id: number, contribution: Partial<Contribution>) => Promise<void>;
  deleteContribution: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      await Database.initialize();
      
      // Only seed data if no groups exist
      const existingGroups = await Database.getGroups();
      if (existingGroups.length === 0) {
        await Database.seedSampleData();
      }
      
      await refreshData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to initialize the application');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [groupsData, participantsData, contributionsData] = await Promise.all([
        Database.getGroups(),
        Database.getParticipants(),
        Database.getContributions(),
      ]);
      setGroups(groupsData);
      setParticipants(participantsData);
      setContributions(contributionsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setCurrency = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const addGroup = async (group: Omit<Group, 'id'>) => {
    try {
      await Database.addGroup(group);
      await refreshData();
    } catch (error) {
      console.error('Failed to add group:', error);
      throw error;
    }
  };

  const updateGroup = async (id: number, group: Partial<Group>) => {
    try {
      await Database.updateGroup(id, group);
      await refreshData();
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      await Database.deleteGroup(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  };

  const addParticipant = async (participant: Omit<Participant, 'id'>) => {
    try {
      await Database.addParticipant(participant);
      await refreshData();
    } catch (error) {
      console.error('Failed to add participant:', error);
      throw error;
    }
  };

  const updateParticipant = async (id: number, participant: Partial<Participant>) => {
    try {
      await Database.updateParticipant(id, participant);
      await refreshData();
    } catch (error) {
      console.error('Failed to update participant:', error);
      throw error;
    }
  };

  const deleteParticipant = async (id: number) => {
    try {
      await Database.deleteParticipant(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete participant:', error);
      throw error;
    }
  };

  const addContribution = async (contribution: Omit<Contribution, 'id'>) => {
    try {
      await Database.addContribution(contribution);
      await refreshData();
    } catch (error) {
      console.error('Failed to add contribution:', error);
      throw error;
    }
  };

  const updateContribution = async (id: number, contribution: Partial<Contribution>) => {
    try {
      await Database.updateContribution(id, contribution);
      await refreshData();
    } catch (error) {
      console.error('Failed to update contribution:', error);
      throw error;
    }
  };

  const deleteContribution = async (id: number) => {
    try {
      await Database.deleteContribution(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete contribution:', error);
      throw error;
    }
  };

  const resetDatabase = async () => {
    try {
      await Database.resetDatabase();
      await refreshData();
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  };
  
  const contextValue: AppContextType = {
    isDarkMode,
    toggleTheme,
    selectedCurrency,
    setCurrency,
    groups,
    participants,
    contributions,
    isLoading,
    refreshData,
    resetDatabase,
    addGroup,
    updateGroup,
    deleteGroup,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    addContribution,
    updateContribution,
    deleteContribution,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};