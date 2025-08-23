// Ad Configuration
export const AD_CONFIG = {
  // Toggle ads on/off for different releases
  SHOW_ADS: true, // Set to false for pro version or testing
  
  // REPLACE THESE WITH YOUR REAL AD UNIT IDs FROM ADMOB CONSOLE
  // Current IDs are Google's test ad unit IDs
  BANNER_AD_ID: 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad ID
  INTERSTITIAL_AD_ID: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad ID  
  REWARDED_AD_ID: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad ID
  
  // App IDs for configuration (replace with your real app IDs)
  ANDROID_APP_ID: 'ca-app-pub-3940256099942544~3347511713', // Test Android App ID
  IOS_APP_ID: 'ca-app-pub-3940256099942544~1458002511', // Test iOS App ID
  
  // Ad placement settings
  SHOW_BANNER_ON_TABS: true,
  SHOW_INTERSTITIAL_ON_ACTIONS: true,
  INTERSTITIAL_FREQUENCY: 3, // Show after every 3 actions
};

export const PRO_VERSION_INFO = {
  CONTACT_EMAIL: 'pro@contributiontracker.app',
  CONTACT_MESSAGE: 'Want an ad-free experience? Contact us for the Pro version!',
  FEATURES: [
    'Ad-free experience',
    'Advanced analytics',
    'Export to multiple formats',
    'Priority support',
    'Custom themes'
  ]
};