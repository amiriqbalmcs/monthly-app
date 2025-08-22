import { Tabs } from 'expo-router';
import { Chrome as Home, Users, UserPlus, DollarSign, Settings } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export default function TabLayout() {
  const { isDarkMode } = useApp();

  const tabBarStyle = {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
    paddingBottom: 20,
    height: 90,
  };

  const screenOptions = {
    headerShown: false,
    tabBarStyle,
    tabBarActiveTintColor: '#667eea',
    tabBarInactiveTintColor: isDarkMode ? '#9ca3af' : '#6b7280',
    tabBarLabelStyle: {
      fontFamily: 'Inter-Medium',
      fontSize: 12,
      marginTop: 4,
    },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <UserPlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contributions"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}