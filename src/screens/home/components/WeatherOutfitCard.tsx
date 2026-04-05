import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { getWeatherSuggestion } from '@/src/services/api/profile.service';
import type { WeatherOutfitSuggestion } from '@/src/types/profile.types';

const LIME = Theme.palette.primary;

const CONDITION_ICONS: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
};

export default function WeatherOutfitCard() {
    const [data, setData] = useState<WeatherOutfitSuggestion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const result = await getWeatherSuggestion();
                setData(result);
            } catch {
                // non-critical, fail silently
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <View style={styles.card}>
                <ActivityIndicator size="small" color={LIME} />
            </View>
        );
    }

    if (!data?.weather) return null;

    const { weather, suggestion } = data;
    const icon = CONDITION_ICONS[weather.condition] ?? '🌤️';
    const tempDisplay = `${Math.round(weather.temperature)}°C`;

    return (
        <Animated.View entering={FadeIn} style={styles.card}>
            <View style={styles.weatherRow}>
                <Text style={styles.weatherIcon}>{icon}</Text>
                <View style={styles.weatherInfo}>
                    <Text style={styles.tempText}>{tempDisplay}</Text>
                    <Text style={styles.conditionText}>{weather.condition}</Text>
                </View>
                {weather.city && <Text style={styles.cityText}>{weather.city}</Text>}
            </View>

            {suggestion ? (
                <View style={styles.suggestionRow}>
                    <View style={styles.outfitDot} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.outfitName}>{suggestion.name}</Text>
                        <Text style={styles.outfitReason} numberOfLines={2}>{suggestion.reason}</Text>
                    </View>
                </View>
            ) : (
                <Text style={styles.noSuggestion}>Add items to your wardrobe to get weather-based outfit picks.</Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
        ...Theme.shadows.sm,
        borderLeftWidth: 3,
        borderLeftColor: '#81D4FA',
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    weatherIcon: { fontSize: 32 },
    weatherInfo: { flex: 1, gap: 1 },
    tempText: { fontSize: 20, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    conditionText: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary },
    cityText: { fontSize: 12, fontFamily: 'GoogleSansFlex_500Medium', color: Theme.colors.text.secondary },
    suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    outfitDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME, marginTop: 6, flexShrink: 0 },
    outfitName: { fontSize: 14, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.colors.text.primary },
    outfitReason: { fontSize: 12, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary, lineHeight: 17, marginTop: 2 },
    noSuggestion: { fontSize: 12, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary, fontStyle: 'italic' },
});
