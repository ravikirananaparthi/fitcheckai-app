import { RefreshProvider, useRefreshContext } from '@/src/contexts/RefreshContext';
import { AnimatedTabBar } from '@components/ui/animated-tab-bar';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotionifyProvider, MotionifyView } from 'react-native-motionify';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const { triggerRefresh } = useRefreshContext();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.hiddenTabBar,
          lazy: true, // Lazy load inactive tabs
          freezeOnBlur: true, // Freeze inactive screens to save memory
        }}
        tabBar={(props) => (
          <MotionifyView
            animatedY
            hideOn="down"
            translateRange={{ from: 0, to: 80 }}
            animationDuration={150}
            style={styles.tabBarMotionify}
          >
            <AnimatedTabBar {...props} onHomeDoubleTap={triggerRefresh} />
          </MotionifyView>
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="ai-stylist"
          options={{
            title: 'AI Stylist',
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: 'Wardrobe',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  return (
    <RefreshProvider>
      <MotionifyProvider threshold={10} supportIdle={false}>
        <TabLayoutContent />
      </MotionifyProvider>
    </RefreshProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hiddenTabBar: {
    display: 'none',
  },
  tabBarMotionify: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});
