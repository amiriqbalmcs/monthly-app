import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users, DollarSign, ChartPie as PieChart, Settings } from 'lucide-react-native';

const features = [
  {
    icon: Users,
    title: 'Group Management',
    description: 'Create and manage multiple groups, events, or campaigns with ease'
  },
  {
    icon: DollarSign,
    title: 'Track Contributions',
    description: 'Monitor participant contributions and financial targets'
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    description: 'Beautiful charts to visualize your data'
  },
  {
    icon: Settings,
    title: 'Customizable',
    description: 'Multiple currencies, themes, and export options'
  }
];

export default function OnboardingScreen() {
  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Fixed Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contribution Tracker</Text>
          <Text style={styles.subtitle}>
            Streamline your group management with powerful tools for tracking contributions and participant engagement
          </Text>
        </View>

        {/* Scrollable Features */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            features.length <= 5 && { flex: 1, justifyContent: 'center' } // center if few
          ]}
          showsVerticalScrollIndicator={false}
        >
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.iconContainer}>
                <feature.icon size={24} color="#ffffff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Fixed Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 40 },
  title: { fontSize: 32, fontFamily: 'Inter-Bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#fff', textAlign: 'center', opacity: 0.9, marginBottom: 20, lineHeight: 24 },
  
  // Scroll area
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#fff', marginBottom: 4 },
  featureDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#fff', opacity: 0.8, lineHeight: 20 },

  // Button fixed at bottom
  buttonWrapper: { padding: 20 },
  button: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#667eea' }
});
