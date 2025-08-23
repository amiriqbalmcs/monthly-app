import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, GAMBannerAd } from 'react-native-google-mobile-ads';
import { AD_CONFIG, PRO_VERSION_INFO } from '@/constants/ads';
import { X, Crown } from 'lucide-react-native';

interface AdBannerProps {
  isDarkMode: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isDarkMode }) => {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  if (!AD_CONFIG.SHOW_ADS) return null;

  const backgroundColor = isDarkMode ? '#1f2937' : '#f3f4f6';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

  const handleProInfo = () => {
    Alert.alert(
      'Go Pro! 👑',
      `${PRO_VERSION_INFO.CONTACT_MESSAGE}\n\nPro Features:\n${PRO_VERSION_INFO.FEATURES.map(f => `• ${f}`).join('\n')}`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Contact Us',
          onPress: () => {
            Alert.alert('Contact Pro Support', `Email: ${PRO_VERSION_INFO.CONTACT_EMAIL}`);
          }
        }
      ]
    );
  };

  // Use test ads for development, real ads for production
  const adUnitId = __DEV__ || Platform.OS === 'web' ? TestIds.BANNER : AD_CONFIG.BANNER_AD_ID;

  if (Platform.OS === 'web' || adError) {
    // Fallback for web or when ads fail to load
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.adContent}>
          <Text style={[styles.adLabel, { color: subTextColor }]}>Advertisement</Text>
          <Text style={[styles.adText, { color: textColor }]}>
            [Demo Ad Space - Your Ad Here]
          </Text>
          <Text style={[styles.adSubtext, { color: subTextColor }]}>
            Sponsored content helps keep this app free
          </Text>
        </View>
        
        <TouchableOpacity style={styles.proButton} onPress={handleProInfo}>
          <Crown size={16} color="#fbbf24" />
          <Text style={styles.proText}>Go Pro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.adContainer, { backgroundColor }]}>
      <Text style={[styles.adLabel, { color: subTextColor }]}>Advertisement</Text>
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setAdError(false);
          }}
          onAdFailedToLoad={(error) => {
            console.log('Banner ad failed to load:', error);
            setAdError(true);
            setAdLoaded(false);
          }}
        />
      </View>
      
      <TouchableOpacity style={styles.proButton} onPress={handleProInfo}>
        <Crown size={16} color="#fbbf24" />
        <Text style={styles.proText}>Go Pro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adContainer: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  adContent: {
    flex: 1,
  },
  adLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    marginBottom: 2,
    textAlign: 'center',
  },
  adText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  adSubtext: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginTop: 8,
  },
  proText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fbbf24',
  },
});