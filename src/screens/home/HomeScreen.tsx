import { Theme } from '@constants/theme';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useMotionify } from 'react-native-motionify';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local components
import ActionButtons from './components/ActionButtons';
import DailyStyleTip from './components/DailyStyleTip';
import HeroSection from './components/HeroSection';
import HomeHeader from './components/HomeHeader';
import RecentFitsSection from './components/RecentFitsSection';
import TrendingSection from './components/TrendingSection';
import WeatherOutfitCard from './components/WeatherOutfitCard';

const BG = Theme.colors.background.light;

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { onScroll } = useMotionify();

    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Fixed Header */}
            <HomeHeader />

            {/* Scrollable Content — Animated.ScrollView for Motionify tab bar collapse */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                <HeroSection />
                <ActionButtons />
                <WeatherOutfitCard />
                <RecentFitsSection />
                <DailyStyleTip />
                <TrendingSection />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
});
