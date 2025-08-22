// Ad Configuration
export const AD_CONFIG = {
  // Toggle ads on/off for different releases
  SHOW_ADS: true, // Set to false for pro version or testing
  
  // Test Ad Unit IDs (replace with real ones for production)
  BANNER_AD_ID: 'ca-app-pub-3940256099942544/6300978111', // Test banner
  INTERSTITIAL_AD_ID: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial
  REWARDED_AD_ID: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded
  
  // Ad placement settings
  SHOW_BANNER_ON_TABS: true,
  SHOW_INTERSTITIAL_ON_ACTIONS: true,
  INTERSTITIAL_FREQUENCY: 3, // Show after every 3 actions
};

export const PRO_VERSION_INFO = {
  CONTACT_EMAIL: 'pro@committeemanager.app',
  CONTACT_MESSAGE: 'Want an ad-free experience? Contact us for the Pro version!',
  FEATURES: [
    'Ad-free experience',
    'Advanced analytics',
    'Export to multiple formats',
    'Priority support',
    'Custom themes'
  ]
};