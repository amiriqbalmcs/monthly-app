import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '@/constants/ads';

class RewardedAdManager {
  private rewardedAd: RewardedAd | null = null;
  private isLoaded = false;
  private rewardCallback: (() => void) | null = null;

  constructor() {
    if (Platform.OS !== 'web' && AD_CONFIG.SHOW_ADS) {
      this.initializeAd();
    }
  }

  private initializeAd() {
    const adUnitId = __DEV__ || Platform.OS === 'web' ? TestIds.REWARDED : AD_CONFIG.REWARDED_AD_ID;
    
    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['finance', 'productivity', 'business'],
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isLoaded = true;
      console.log('Rewarded ad loaded successfully');
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
      if (this.rewardCallback) {
        this.rewardCallback();
        this.rewardCallback = null;
      }
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      this.isLoaded = false;
      this.rewardCallback = null;
      console.log('Rewarded ad closed');
      // Preload the next ad
      this.loadAd();
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.log('Rewarded ad error:', error);
      this.isLoaded = false;
      this.rewardCallback = null;
      // Try to reload after error
      setTimeout(() => this.loadAd(), 5000);
    });

    this.loadAd();
  }

  private loadAd() {
    if (this.rewardedAd && !this.isLoaded && Platform.OS !== 'web') {
      this.rewardedAd.load();
    }
  }

  public showRewardedAd(onReward: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (!AD_CONFIG.SHOW_ADS) {
        // If ads are disabled, just give the reward
        onReward();
        resolve(true);
        return;
      }

      if (Platform.OS === 'web') {
        // Web fallback - just give the reward
        Alert.alert(
          'Reward Unlocked!',
          'Feature unlocked! (Ads not supported on web)',
          [{ text: 'OK', onPress: () => onReward() }]
        );
        resolve(true);
        return;
      }

      if (this.rewardedAd && this.isLoaded) {
        this.rewardCallback = () => {
          onReward();
          resolve(true);
        };
        this.rewardedAd.show();
      } else {
        Alert.alert(
          'Ad Not Ready',
          'Please try again in a moment.',
          [{ text: 'OK', onPress: () => resolve(false) }]
        );
      }
    });
  }
}

// Singleton instance
export const rewardedAdManager = new RewardedAdManager();

// Hook for easy integration
export const useRewardedAd = () => {
  return {
    showRewardedAd: (onReward: () => void) => rewardedAdManager.showRewardedAd(onReward),
  };
};