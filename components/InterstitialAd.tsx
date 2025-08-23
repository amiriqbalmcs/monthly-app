import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '@/constants/ads';

class InterstitialAdManager {
  private interstitial: InterstitialAd | null = null;
  private actionCount = 0;
  private isLoaded = false;

  constructor() {
    if (Platform.OS !== 'web' && AD_CONFIG.SHOW_ADS) {
      this.initializeAd();
    }
  }

  private initializeAd() {
    const adUnitId = __DEV__ || Platform.OS === 'web' ? TestIds.INTERSTITIAL : AD_CONFIG.INTERSTITIAL_AD_ID;
    
    this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['finance', 'productivity', 'business'],
    });

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.isLoaded = true;
      console.log('Interstitial ad loaded successfully');
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      this.isLoaded = false;
      console.log('Interstitial ad closed');
      // Preload the next ad
      this.loadAd();
    });

    this.interstitial.addAdEventListener(AdEventType.OPENED, () => {
      console.log('Interstitial ad opened');
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      this.isLoaded = false;
      // Try to reload after error
      setTimeout(() => this.loadAd(), 5000);
    });

    this.loadAd();
  }

  private loadAd() {
    if (this.interstitial && !this.isLoaded && Platform.OS !== 'web') {
      this.interstitial.load();
    }
  }

  public showAdOnAction() {
    if (!AD_CONFIG.SHOW_ADS || !AD_CONFIG.SHOW_INTERSTITIAL_ON_ACTIONS || Platform.OS === 'web') return;

    this.actionCount++;
    console.log(`Action count: ${this.actionCount}/${AD_CONFIG.INTERSTITIAL_FREQUENCY}`);
    
    if (this.actionCount >= AD_CONFIG.INTERSTITIAL_FREQUENCY) {
      this.actionCount = 0; // Reset counter
      
      if (this.interstitial && this.isLoaded) {
        console.log('Showing interstitial ad');
        this.interstitial.show();
      } else {
        console.log('Interstitial ad not ready, preloading...');
        this.loadAd();
      }
    }
  }

  public resetActionCount() {
    this.actionCount = 0;
  }
}

// Singleton instance
export const interstitialAdManager = new InterstitialAdManager();

// Hook for easy integration
export const useInterstitialAd = () => {
  return {
    showAdOnAction: () => interstitialAdManager.showAdOnAction(),
    resetActionCount: () => interstitialAdManager.resetActionCount(),
  };
};