import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Database } from '@/services/Database';
import { useApp } from '@/contexts/AppContext';
import { CURRENCIES } from '@/types';
import { CurrencyModal } from '@/components/CurrencyModal';
import { 
  Moon, Sun, Globe, Download, Upload, Info, 
  Palette, Database as DatabaseIcon, Share2, Mail, Shield 
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { 
    isDarkMode, 
    toggleTheme, 
    selectedCurrency, 
    setCurrency,
    groups,
    participants,
    contributions,
    refreshData,
    resetDatabase
  } = useApp();

  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const cardBackground = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

  const handleExportData = async () => {
    try {
      const exportData = {
        groups,
        participants,
        contributions,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `contribution-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // For web platform, create a download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully');
      } else {
        // For mobile platforms, save to device and share
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Contribution Tracker Data'
          });
        } else {
          Alert.alert('Success', `Data exported to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const importData = JSON.parse(fileContent);

        // Validate the import data structure
        if (!importData.groups || !importData.participants || !importData.contributions) {
          Alert.alert('Error', 'Invalid file format. Please select a valid Contribution Tracker export file.');
          return;
        }

        Alert.alert(
          'Import Data',
          'This will replace all existing data. Are you sure you want to continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              style: 'destructive',
              onPress: async () => {
                try {
                  await Database.clearAllData();
                  await Database.importData(importData);
                  await refreshData();
                  Alert.alert('Success', 'Data imported successfully');
                } catch (error) {
                  console.error('Import error:', error);
                  Alert.alert('Error', 'Failed to import data');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data');
    }
  };

const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This will permanently delete ALL your data and restore sample data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database has been reset with sample data');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset database');
            }
          }
        }
      ]
    );
  };
  
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'For support and feedback, please reach out to us.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            // In a real app, you would open the email client
            Alert.alert('Email', 'support@contributiontracker.app');
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Contribution Tracker',
      'Contribution Tracker v1.0.0\n\nA comprehensive solution for managing groups, participants, and contributions.\n\nBuilt with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  const settingSections = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          title: 'Theme',
          subtitle: isDarkMode ? 'Dark Mode' : 'Light Mode',
          icon: isDarkMode ? Moon : Sun,
          onPress: toggleTheme,
          showToggle: true,
          value: isDarkMode
        }
      ]
    },
    {
      title: 'Preferences',
      icon: Globe,
      items: [
        {
          title: 'Currency',
          subtitle: `${selectedCurrency} - ${CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}`,
          icon: Globe,
          onPress: () => setIsCurrencyModalVisible(true)
        }
      ]
    },
    {
      title: 'Data Management',
      icon: DatabaseIcon,
      items: [
        {
          title: 'Export Data',
          subtitle: 'Backup your groups and contributions',
          icon: Upload,
          onPress: handleExportData
        },
        {
          title: 'Import Data',
          subtitle: 'Restore from backup file',
          icon: Download,
          onPress: handleImportData
        },
        {
          title: 'Reset Database',
          subtitle: 'Delete all data and restore samples',
          icon: RotateCcw,
          onPress: handleResetDatabase
        }
      ]
    },
    {
      title: 'Support',
      icon: Shield,
      items: [
        {
          title: 'Contact Support',
          subtitle: 'Get help and send feedback',
          icon: Mail,
          onPress: handleContactSupport
        },
        {
          title: 'About',
          subtitle: 'App version and information',
          icon: Info,
          onPress: handleAbout
        }
      ]
    }
  ];

  const dataStats = {
    groups: groups.length,
    participants: participants.length,
    contributions: contributions.length,
    totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0)
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Customize your app experience and manage data
          </Text>
        </View>

        {/* Data Overview Card */}
        <Animated.View 
          entering={FadeInUp.delay(100)}
          style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}
        >
          <Text style={[styles.statsTitle, { color: textColor }]}>Data Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#667eea' }]}>{dataStats.groups}</Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{dataStats.participants}</Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>Participants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{dataStats.contributions}</Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>Contributions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>${dataStats.totalAmount.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>Total Amount</Text>
            </View>
          </View>
        </Animated.View>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <Animated.View 
            key={section.title}
            entering={FadeInUp.delay((sectionIndex + 2) * 100)}
            style={[styles.section, { backgroundColor: cardBackground }]}
          >
            <View style={styles.sectionHeader}>
              <section.icon size={20} color="#667eea" />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {section.title}
              </Text>
            </View>

            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.settingItem,
                  itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  { borderColor }
                ]}
                onPress={item.onPress}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
                    <item.icon size={18} color="#667eea" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: textColor }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: subTextColor }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                
                {item.showToggle && (
                  <View style={[
                    styles.toggle,
                    { backgroundColor: item.value ? '#667eea' : (isDarkMode ? '#374151' : '#e5e7eb') }
                  ]}>
                    <View style={[
                      styles.toggleKnob,
                      { 
                        backgroundColor: '#ffffff',
                        transform: [{ translateX: item.value ? 14 : 0 }]
                      }
                    ]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CurrencyModal
        visible={isCurrencyModalVisible}
        onClose={() => setIsCurrencyModalVisible(false)}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setCurrency}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});