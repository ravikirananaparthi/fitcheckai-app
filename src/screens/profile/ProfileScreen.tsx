import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, StatusBar, Image,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { getProfile } from '@/src/services/api/profile.service';
import { ColorAnalysisScreen } from './ColorAnalysisScreen';
import { CalendarScreen } from '../calendar/CalendarScreen';
import type { UserProfile, StylePersona, ColorSeason } from '@/src/types/profile.types';

const LIME = Theme.palette.primary;

type ScreenState =
    | { view: 'profile' }
    | { view: 'colorAnalysis' }
    | { view: 'calendar' };

const PERSONA_META: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
    MINIMALIST: { emoji: '🤍', label: 'Minimalist', desc: 'Clean lines, neutral palette, less is more', color: '#E0E0E0' },
    MAXIMALIST: { emoji: '🌈', label: 'Maximalist', desc: 'Bold prints, vibrant colors, more is more', color: '#FF6B6B' },
    STREETWEAR: { emoji: '🔥', label: 'Streetwear', desc: 'Urban edge, sneakers, graphic layers', color: '#FF9800' },
    CLASSIC: { emoji: '👔', label: 'Classic', desc: 'Timeless pieces, tailored fits, elegant', color: '#5C6BC0' },
    BOHO: { emoji: '🌻', label: 'Boho', desc: 'Free-spirited, flowing fabrics, earthy tones', color: '#8D6E63' },
    DARK_ACADEMIC: { emoji: '📚', label: 'Dark Academic', desc: 'Scholarly, dark tones, layered textures', color: '#455A64' },
    PREPPY: { emoji: '⛵', label: 'Preppy', desc: 'Polished, colorful, ivy league inspired', color: '#26A69A' },
    ATHLEISURE: { emoji: '🏃', label: 'Athleisure', desc: 'Sport-meets-street, comfortable, active', color: '#66BB6A' },
};

const SEASON_META: Record<string, { emoji: string; label: string; colors: string[]; desc: string }> = {
    SPRING: { emoji: '🌸', label: 'Spring', colors: ['#FFB74D', '#FFCC80', '#A5D6A7', '#81D4FA'], desc: 'Warm, clear, golden undertones' },
    SUMMER: { emoji: '☀️', label: 'Summer', colors: ['#CE93D8', '#90CAF9', '#B0BEC5', '#F48FB1'], desc: 'Cool, muted, soft undertones' },
    AUTUMN: { emoji: '🍂', label: 'Autumn', colors: ['#D84315', '#BF360C', '#827717', '#4E342E'], desc: 'Warm, deep, earthy undertones' },
    WINTER: { emoji: '❄️', label: 'Winter', colors: ['#1A237E', '#880E4F', '#FAFAFA', '#212121'], desc: 'Cool, vivid, high contrast' },
};

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<ScreenState>({ view: 'profile' });
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    }, [loadProfile]);

    // Sub-screens
    if (state.view === 'colorAnalysis') {
        return (
            <ColorAnalysisScreen
                currentSeason={profile?.colorPalette ?? null}
                onBack={() => { setState({ view: 'profile' }); loadProfile(); }}
            />
        );
    }

    if (state.view === 'calendar') {
        return <CalendarScreen onBack={() => setState({ view: 'profile' })} />;
    }

    // Loading
    if (loading) {
        return (
            <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={LIME} />
            </View>
        );
    }

    const persona = profile?.stylePersona ?? 'UNCLASSIFIED';
    const personaData = PERSONA_META[persona];
    const seasonData = profile?.colorPalette ? SEASON_META[profile.colorPalette] : null;
    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
        : null;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIME} />}
            >
                {/* Header */}
                <Animated.View entering={FadeIn} style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </Animated.View>

                {/* User card */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.userCard}>
                    <View style={styles.avatarCircle}>
                        {profile?.avatar ? (
                            <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                        ) : (
                            <Text style={styles.avatarInitial}>
                                {(profile?.name ?? 'U').charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{profile?.name ?? 'Fashion Explorer'}</Text>
                        {profile?.city && <Text style={styles.userCity}>{profile.city}</Text>}
                        {memberSince && <Text style={styles.memberSince}>Member since {memberSince}</Text>}
                    </View>
                    <View style={[styles.planBadge, profile?.plan === 'PRO' && styles.planBadgePro]}>
                        <Text style={[styles.planText, profile?.plan === 'PRO' && styles.planTextPro]}>
                            {profile?.plan ?? 'FREE'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Stats row */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{profile?.fitCheckCount ?? 0}</Text>
                        <Text style={styles.statLabel}>Fit Checks</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {persona !== 'UNCLASSIFIED' ? '1' : '0'}
                        </Text>
                        <Text style={styles.statLabel}>Style DNA</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{seasonData ? '1' : '0'}</Text>
                        <Text style={styles.statLabel}>Color Type</Text>
                    </View>
                </Animated.View>

                {/* Style Persona */}
                {personaData && persona !== 'UNCLASSIFIED' ? (
                    <Animated.View entering={FadeInDown.delay(150)} style={styles.personaCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Style DNA</Text>
                            <View style={[styles.personaDot, { backgroundColor: personaData.color }]} />
                        </View>
                        <View style={styles.personaBody}>
                            <Text style={styles.personaEmoji}>{personaData.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.personaLabel}>{personaData.label}</Text>
                                <Text style={styles.personaDesc}>{personaData.desc}</Text>
                            </View>
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeInDown.delay(150)} style={styles.lockedCard}>
                        <Text style={styles.lockedEmoji}>🔒</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lockedTitle}>Style DNA</Text>
                            <Text style={styles.lockedDesc}>
                                Complete {Math.max(0, 10 - (profile?.fitCheckCount ?? 0))} more fit checks to unlock your style persona.
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(100, ((profile?.fitCheckCount ?? 0) / 10) * 100)}%` }]} />
                        </View>
                    </Animated.View>
                )}

                {/* Color Palette */}
                {seasonData ? (
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.colorCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Color Palette</Text>
                            <Text style={styles.sectionEmoji}>{seasonData.emoji}</Text>
                        </View>
                        <Text style={styles.colorSeason}>{seasonData.label} Type</Text>
                        <Text style={styles.colorDesc}>{seasonData.desc}</Text>
                        <View style={styles.swatchRow}>
                            {seasonData.colors.map((c) => (
                                <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.retakeBtn}
                            onPress={() => setState({ view: 'colorAnalysis' })}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retakeBtnText}>Re-analyze</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <TouchableOpacity
                            style={styles.ctaCard}
                            onPress={() => setState({ view: 'colorAnalysis' })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaEmoji}>🎨</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.ctaTitle}>Discover Your Colors</Text>
                                <Text style={styles.ctaDesc}>Upload a portrait to find your seasonal color palette.</Text>
                            </View>
                            <Text style={styles.ctaArrow}>→</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Outfit Calendar CTA */}
                <Animated.View entering={FadeInDown.delay(250)}>
                    <TouchableOpacity
                        style={styles.ctaCard}
                        onPress={() => setState({ view: 'calendar' })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaEmoji}>📅</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.ctaTitle}>Outfit Calendar</Text>
                            <Text style={styles.ctaDesc}>Plan your outfits for the week ahead.</Text>
                        </View>
                        <Text style={styles.ctaArrow}>→</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Style Preferences */}
                {(profile?.stylePrefs?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.prefsCard}>
                        <Text style={styles.sectionTitle}>Style Preferences</Text>
                        <View style={styles.chipRow}>
                            {profile!.stylePrefs.map((pref) => (
                                <View key={pref} style={styles.chip}>
                                    <Text style={styles.chipText}>{pref}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Theme.colors.background.light },
    center: { alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Theme.spacing.md, gap: Theme.spacing.md },
    header: { paddingTop: Theme.spacing.sm },
    headerTitle: { fontSize: 28, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },

    // User card
    userCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    avatarCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: LIME, alignItems: 'center', justifyContent: 'center',
    },
    avatarImg: { width: 56, height: 56, borderRadius: 28 },
    avatarInitial: { fontSize: 22, fontFamily: 'GoogleSansFlex_700Bold', color: '#111' },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: 18, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    userCity: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary },
    memberSince: { fontSize: 12, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary },
    planBadge: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.radius.full,
        backgroundColor: '#F0F0F0', alignSelf: 'flex-start',
    },
    planBadgePro: { backgroundColor: '#FFF8E1' },
    planText: { fontSize: 11, fontFamily: 'GoogleSansFlex_700Bold', color: '#999', letterSpacing: 0.5 },
    planTextPro: { color: '#F59E0B' },

    // Stats
    statsRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    statCard: { flex: 1, alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 22, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    statLabel: { fontSize: 11, fontFamily: 'GoogleSansFlex_500Medium', color: Theme.colors.text.secondary },
    statDivider: { width: 1, height: 32, backgroundColor: '#E8E8E8' },

    // Style Persona
    personaCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md, gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 14, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase' },
    sectionEmoji: { fontSize: 20 },
    personaDot: { width: 10, height: 10, borderRadius: 5 },
    personaBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    personaEmoji: { fontSize: 40 },
    personaLabel: { fontSize: 20, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    personaDesc: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary, lineHeight: 18, marginTop: 2 },

    // Locked persona
    lockedCard: {
        backgroundColor: '#F9F9F9', borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#ECECEC', borderStyle: 'dashed',
    },
    lockedEmoji: { fontSize: 28 },
    lockedTitle: { fontSize: 14, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    lockedDesc: { fontSize: 12, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary, lineHeight: 17, marginTop: 2 },
    progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#E8E8E8', borderBottomLeftRadius: Theme.radius.xl, borderBottomRightRadius: Theme.radius.xl },
    progressFill: { height: 3, backgroundColor: LIME, borderBottomLeftRadius: Theme.radius.xl },

    // Color palette
    colorCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md, gap: 8,
        ...Theme.shadows.sm,
    },
    colorSeason: { fontSize: 20, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    colorDesc: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary },
    swatchRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    swatch: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#00000010' },
    retakeBtn: { alignSelf: 'flex-start', marginTop: 4 },
    retakeBtnText: { fontSize: 13, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.palette.primaryDark },

    // CTA cards
    ctaCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    ctaEmoji: { fontSize: 32 },
    ctaTitle: { fontSize: 16, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    ctaDesc: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary, lineHeight: 18, marginTop: 2 },
    ctaArrow: { fontSize: 20, color: LIME, fontFamily: 'GoogleSansFlex_700Bold' },

    // Preferences
    prefsCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl, padding: Theme.spacing.md, gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.radius.full, backgroundColor: '#F0F0F0' },
    chipText: { fontSize: 12, fontFamily: 'GoogleSansFlex_500Medium', color: '#555' },
});
