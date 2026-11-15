import { fitCheckColors as colors } from '@/constants/fitcheck-colors';
import { Image } from 'expo-image';
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { analyzeColorPalette } from '@/src/services/api/profile.service';
import type { ColorSeason } from '@/src/types/profile.types';

const accent = colors.purple;

const SEASON_DATA: Record<string, { emoji: string; label: string; colors: string[]; desc: string; tips: string[] }> = {
    SPRING: {
        emoji: '🌸', label: 'Spring',
        colors: ['#FFB74D', '#FFCC80', '#A5D6A7', '#81D4FA', '#FFF176', '#CE93D8'],
        desc: 'You have warm, clear, golden undertones. You look best in warm, bright colors that reflect your natural glow.',
        tips: ['Warm whites over cool whites', 'Coral over pink', 'Peach, salmon, golden yellow', 'Warm greens and teals'],
    },
    SUMMER: {
        emoji: '☀️', label: 'Summer',
        colors: ['#CE93D8', '#90CAF9', '#B0BEC5', '#F48FB1', '#80CBC4', '#EF9A9A'],
        desc: 'You have cool, muted, soft undertones. Soft, powdery colors harmonize beautifully with your complexion.',
        tips: ['Lavender, mauve, dusty rose', 'Powder blue, soft navy', 'Cool grays and silvers', 'Avoid bright orange and gold'],
    },
    AUTUMN: {
        emoji: '🍂', label: 'Autumn',
        colors: ['#D84315', '#BF360C', '#827717', '#4E342E', '#FF8F00', '#33691E'],
        desc: 'You have warm, deep, earthy undertones. Rich, grounded colors bring out your natural warmth.',
        tips: ['Rust, terracotta, burnt orange', 'Olive, forest green, khaki', 'Warm browns and tans', 'Gold jewelry over silver'],
    },
    WINTER: {
        emoji: '❄️', label: 'Winter',
        colors: ['#1A237E', '#880E4F', '#FAFAFA', '#212121', '#D32F2F', '#1565C0'],
        desc: 'You have cool, vivid, high-contrast features. Bold, clear colors and sharp contrasts suit you best.',
        tips: ['True white and jet black', 'Royal blue, emerald green', 'Bright magenta, true red', 'Silver jewelry over gold'],
    },
};

type AnalysisState =
    | { step: 'idle' }
    | { step: 'analyzing'; imageUri: string }
    | { step: 'result'; season: ColorSeason; imageUri: string };

interface Props {
    currentSeason: ColorSeason | null;
    onBack: () => void;
}

export function ColorAnalysisScreen({ currentSeason, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<AnalysisState>(
        currentSeason ? { step: 'result', season: currentSeason, imageUri: '' } : { step: 'idle' },
    );

    const pickAndAnalyze = useCallback(async (source: 'camera' | 'gallery') => {
        const permission =
            source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Permission needed', `Please allow ${source} access.`);
            return;
        }

        const result =
            source === 'camera'
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] });

        if (result.canceled || !result.assets[0]) return;

        const imageUri = result.assets[0].uri;
        setState({ step: 'analyzing', imageUri });

        try {
            const data = await analyzeColorPalette(imageUri);
            setState({ step: 'result', season: data.colorPalette, imageUri });
        } catch (err: any) {
            Alert.alert('Analysis failed', err?.message ?? 'Please try again with a clear portrait photo.');
            setState({ step: 'idle' });
        }
    }, []);

    const seasonInfo = state.step === 'result' ? SEASON_DATA[state.season] : null;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.backBtn}>← Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Analyzing state */}
            {state.step === 'analyzing' && (
                <Animated.View entering={FadeIn} style={[styles.center, { flex: 1 }]}>
                    <Image source={{ uri: state.imageUri }} style={styles.analyzePreview} contentFit="cover" />
                    <ActivityIndicator size="large" color={accent} style={{ marginTop: 24 }} />
                    <Text style={styles.analyzeTitle}>Analyzing your colors...</Text>
                    <Text style={styles.analyzeSub}>FitCheck is analyzing your skin tone, hair, and eye color.</Text>
                </Animated.View>
            )}

            {/* Result state */}
            {state.step === 'result' && seasonInfo && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                >
                    <Animated.View entering={FadeIn} style={styles.resultHeader}>
                        <Text style={styles.resultEmoji}>{seasonInfo.emoji}</Text>
                        <Text style={styles.resultTitle}>You’re a {seasonInfo.label}</Text>
                        <Text style={styles.resultDesc}>{seasonInfo.desc}</Text>
                    </Animated.View>

                    {/* Color swatches */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.swatchCard}>
                        <Text style={styles.cardTitle}>Your Best Colors</Text>
                        <View style={styles.swatchGrid}>
                            {seasonInfo.colors.map((c) => (
                                <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                            ))}
                        </View>
                    </Animated.View>

                    {/* Style tips */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.tipsCard}>
                        <Text style={styles.cardTitle}>Color Tips</Text>
                        {seasonInfo.tips.map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                                <View style={[styles.tipDot, { backgroundColor: seasonInfo.colors[i % seasonInfo.colors.length] }]} />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Re-analyze button */}
                    <TouchableOpacity
                        style={styles.reanalyzeBtn}
                        onPress={() => {
                            Alert.alert('Re-analyze', 'Choose photo source', [
                                { text: 'Camera', onPress: () => pickAndAnalyze('camera') },
                                { text: 'Gallery', onPress: () => pickAndAnalyze('gallery') },
                                { text: 'Cancel', style: 'cancel' },
                            ]);
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.reanalyzeBtnText}>Take New Portrait</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Idle state */}
            {state.step === 'idle' && (
                <Animated.View entering={FadeIn} style={[styles.center, { flex: 1, paddingHorizontal: Theme.spacing.xl }]}>
                    <Text style={styles.idleEmoji}>🎨</Text>
                    <Text style={styles.idleTitle}>Color Analysis</Text>
                    <Text style={styles.idleSub}>
                        Upload a clear portrait photo (natural lighting works best) and AI will determine your seasonal color palette.
                    </Text>
                    <View style={styles.idleBtns}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => pickAndAnalyze('camera')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Take Selfie</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => pickAndAnalyze('gallery')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: Theme.colors.background.light },
    center: { alignItems: 'center', justifyContent: 'center', gap: Theme.spacing.sm },
    topBar: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm },
    backBtn: { fontSize: 16, fontFamily: 'GoogleSansFlex_600SemiBold', color: colors.purple },
    scroll: { paddingHorizontal: Theme.spacing.md, gap: Theme.spacing.md },

    // Analyzing
    analyzePreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: accent },
    analyzeTitle: { fontSize: 18, fontFamily: 'GoogleSansFlex_700Bold', color: colors.ink, marginTop: 8 },
    analyzeSub: { fontSize: 14, fontFamily: 'GoogleSansFlex_400Regular', color: colors.secondary, textAlign: 'center', paddingHorizontal: 32 },

    // Result
    resultHeader: { alignItems: 'center', paddingVertical: Theme.spacing.lg, gap: 8 },
    resultEmoji: { fontSize: 56 },
    resultTitle: { fontSize: 26, fontFamily: 'GoogleSansFlex_700Bold', color: colors.ink },
    resultDesc: { fontSize: 14, fontFamily: 'GoogleSansFlex_400Regular', color: colors.secondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },

    swatchCard: {
        backgroundColor: colors.surface,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md, gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    cardTitle: { fontSize: 14, fontFamily: 'GoogleSansFlex_700Bold', color: colors.secondary, letterSpacing: 0.5, textTransform: 'uppercase' },
    swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#00000010' },

    tipsCard: {
        backgroundColor: colors.surface,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md, gap: 10,
        ...Theme.shadows.sm,
    },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tipDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    tipText: { fontSize: 14, fontFamily: 'GoogleSansFlex_400Regular', color: colors.ink, lineHeight: 20 },

    reanalyzeBtn: {
        borderWidth: 1.5, borderColor: accent, borderRadius: Theme.radius.xl,
        paddingVertical: 14, alignItems: 'center',
    },
    reanalyzeBtnText: { fontSize: 15, fontFamily: 'GoogleSansFlex_600SemiBold', color: colors.purple },

    // Idle
    idleEmoji: { fontSize: 64 },
    idleTitle: { fontSize: 24, fontFamily: 'GoogleSansFlex_700Bold', color: colors.ink },
    idleSub: { fontSize: 15, fontFamily: 'GoogleSansFlex_400Regular', color: colors.secondary, textAlign: 'center', lineHeight: 22 },
    idleBtns: { marginTop: Theme.spacing.md, gap: Theme.spacing.sm, width: '100%' },
    primaryBtn: { backgroundColor: accent, borderRadius: Theme.radius.xl, paddingVertical: 16, alignItems: 'center', ...Theme.shadows.sm },
    primaryBtnText: { fontSize: 16, fontFamily: 'GoogleSansFlex_700Bold', color: '#fff' },
    secondaryBtn: { borderWidth: 1.5, borderColor: accent, borderRadius: Theme.radius.xl, paddingVertical: 15, alignItems: 'center' },
    secondaryBtnText: { fontSize: 16, fontFamily: 'GoogleSansFlex_600SemiBold', color: colors.purple },
});
