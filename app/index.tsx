import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem("hasLaunched");
        if (value === null) {
          // First time
          await AsyncStorage.setItem("hasLaunched", "true");
          setFirstLaunch(true);
        } else {
          // Not first time
          setFirstLaunch(false);
        }
      } catch (err) {
        console.error("Error checking first launch:", err);
        setFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);
  if (firstLaunch === null) {
    // Show a loading spinner while we check storage
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return firstLaunch ? <Redirect href="/onboarding" /> : <Redirect href="/(tabs)" />;
}