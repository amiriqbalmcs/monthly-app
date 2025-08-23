import { useEffect } from 'react';
import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '@/constants/ads';

export const useAdMobInitialization = () => {
  useEffect(() => {
    if (Platform.OS === 'web' || !AD_CONFIG.SHOW_ADS) return;

    const initializeAdMob = async () => {
      try {
        await mobileAds().initialize();
        console.log('AdMob initialized successfully');
      } catch (error) {
        console.error('AdMob initialization failed:', error);
      }
    };

    initializeAdMob();
  }, []);
};