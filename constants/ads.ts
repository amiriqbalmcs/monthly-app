import { TestIds } from "react-native-google-mobile-ads";

// Ad Configuration
export const AD_CONFIG = {
  // Toggle ads on/off for different releases
  SHOW_ADS: true, // Set to false for pro version or testing
    
  // Always use Google's provided test unit IDs in dev
  BANNER_AD_ID: __DEV__ ? TestIds.BANNER : 'ca-app-pub-9750340209158791/2462914098',
  INTERSTITIAL_AD_ID: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-9750340209158791/8836750759',
  REWARDED_AD_ID: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-9750340209158791/2078968389',
  
  ANDROID_APP_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544~3347511713' 
    : 'ca-app-pub-9750340209158791~9957458408',
  IOS_APP_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544~1458002511' 
    : 'your-real-ios-app-id',

  // Ad placement settings
  SHOW_BANNER_ON_TABS: true,
  SHOW_INTERSTITIAL_ON_ACTIONS: true,
  INTERSTITIAL_FREQUENCY: 5, // Show after every 5 actions
};

export const PRO_VERSION_INFO = {
  CONTACT_EMAIL: 'aamirktk49@gmail.com',
  CONTACT_MESSAGE: 'Want an ad-free experience? Contact us for the Pro version!',
  FEATURES: [
    'Ad-free experience',
    'Priority support',
    'More features coming soon'
  ]
};