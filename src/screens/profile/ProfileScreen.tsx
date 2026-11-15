import { fitCheckColors as colors } from '@/constants/fitcheck-colors';
import { FontFamily, Theme } from '@/constants/theme';
import { getProfile } from '@/src/services/api/profile.service';
import type { StylePersona } from '@/src/types/profile.types';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { CalendarDays, ChevronRight, Palette, ScanLine, Sparkles, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarScreen } from '../calendar/CalendarScreen';
import { ColorAnalysisScreen } from './ColorAnalysisScreen';

const PERSONA_META: Record<Exclude<StylePersona, 'UNCLASSIFIED'>, { label: string; desc: string }> = {
    MINIMALIST: { label: 'Minimalist', desc: 'Clean lines, neutral palette, less is more' },
    MAXIMALIST: { label: 'Maximalist', desc: 'Bold prints, vibrant colors, more is more' },
    STREETWEAR: { label: 'Streetwear', desc: 'Urban edge, sneakers, graphic layers' },
    CLASSIC: { label: 'Classic', desc: 'Timeless pieces, tailored fits, elegant' },
    BOHO: { label: 'Boho', desc: 'Free-spirited, flowing fabrics, earthy tones' },
    DARK_ACADEMIC: { label: 'Dark Academic', desc: 'Scholarly, dark tones, layered textures' },
    PREPPY: { label: 'Preppy', desc: 'Polished, colorful, ivy league inspired' },
    ATHLEISURE: { label: 'Athleisure', desc: 'Sport-meets-street, comfortable, active' },
};

const SEASON_META: Record<string, { label: string; colors: string[]; desc: string }> = {
    SPRING: { label: 'Spring', colors: ['#FFB74D', '#FFCC80', '#A5D6A7', '#81D4FA'], desc: 'Warm, clear, golden undertones' },
    SUMMER: { label: 'Summer', colors: ['#CE93D8', '#90CAF9', '#B0BEC5', '#F48FB1'], desc: 'Cool, muted, soft undertones' },
    AUTUMN: { label: 'Autumn', colors: ['#D84315', '#BF360C', '#827717', '#4E342E'], desc: 'Warm, deep, earthy undertones' },
    WINTER: { label: 'Winter', colors: ['#1A237E', '#880E4F', '#FAFAFA', '#212121'], desc: 'Cool, vivid, high contrast' },
};

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { width, fontScale } = useWindowDimensions();
    const [view, setView] = useState<'profile' | 'colors' | 'calendar'>('profile');
    const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile });
    const user = profile.data;
    const persona = user && user.stylePersona !== 'UNCLASSIFIED' ? PERSONA_META[user.stylePersona] : null;
    const season = user?.colorPalette ? SEASON_META[user.colorPalette] : null;
    const fitChecks = user?.fitCheckCount ?? 0;
    const milestone = 10;
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : null;
    const availableWidth = Platform.OS === 'web' && width >= 760 ? width - 240 : width;
    const wide = availableWidth / fontScale >= 650;
    const back = () => setView('profile');

    if (view === 'calendar') return <CalendarScreen onBack={back} />;
    if (view === 'colors') return (
        <ColorAnalysisScreen currentSeason={user?.colorPalette ?? null} onBack={() => {
            back();
            void profile.refetch();
        }} />
    );

    return (
        <ScrollView
            style={[styles.root, { paddingTop: insets.top }]}
            contentContainerStyle={[styles.page, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 72 : 28 }]}
            refreshControl={<RefreshControl refreshing={profile.isRefetching} onRefresh={() => void profile.refetch()} tintColor={colors.purple} />}
        >
            <Text accessibilityRole="header" style={styles.title}>Profile</Text>
            {profile.isPending && <ActivityIndicator color={colors.purple} accessibilityLabel="Loading profile" />}
            {profile.isError && !user && (
                <View style={[styles.card, styles.panel]}>
                    <Text accessibilityRole="alert" style={styles.sectionTitle}>Couldn’t load your profile</Text>
                    <Pressable accessibilityRole="button" style={styles.retry} onPress={() => void profile.refetch()}>
                        <Text style={styles.actionText}>Try again</Text>
                    </Pressable>
                </View>
            )}
            {user && (
                <View style={[styles.card, styles.identity]}>
                    <View style={styles.avatar}>
                        <UserRound size={25} color={colors.purple} />
                        {!!user.avatar && <Image source={user.avatar} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />}
                    </View>
                    <View style={styles.copy}>
                        <Text style={styles.name}>{user.name?.trim() || 'Your account'}</Text>
                        {!!user.city && <Text style={styles.body}>{user.city}</Text>}
                        {!!memberSince && <Text style={styles.body}>Member since {memberSince}</Text>}
                    </View>
                    <View style={styles.badge}><Text style={styles.actionText}>{user.plan === 'PRO' ? 'Pro' : 'Free'}</Text></View>
                </View>
            )}
            <View style={[styles.sections, wide && styles.sectionsWide]}>
                <View style={styles.section}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>Style tools</Text>
                    <View style={styles.card}>
                        <Pressable accessibilityRole="button" onPress={() => setView('colors')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                            <View style={styles.icon}><Palette size={21} color={colors.purple} /></View>
                            <View style={styles.copy}>
                                <Text style={styles.label}>Color analysis</Text>
                                <Text style={styles.body}>{season ? `${season.label} palette · ${season.desc}` : 'Find the colors that suit you'}</Text>
                                {season && <View style={styles.swatches} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                    {season.colors.map((color) => <View key={color} style={[styles.swatch, { backgroundColor: color }]} />)}
                                </View>}
                            </View>
                            <ChevronRight size={18} color={colors.secondary} />
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => setView('calendar')} style={({ pressed }) => [styles.row, styles.divider, pressed && styles.pressed]}>
                            <View style={styles.icon}><CalendarDays size={21} color={colors.purple} /></View>
                            <View style={styles.copy}>
                                <Text style={styles.label}>Outfit calendar</Text>
                                <Text style={styles.body}>Plan what to wear this week</Text>
                            </View>
                            <ChevronRight size={18} color={colors.secondary} />
                        </Pressable>
                    </View>
                </View>
                {user && (
                    <View style={styles.section}>
                        <Text accessibilityRole="header" style={styles.sectionTitle}>Style DNA</Text>
                        <View style={[styles.card, styles.panel]}>
                            <View style={styles.summary}>
                                <View style={styles.icon}>
                                    {persona ? <Sparkles size={20} color={colors.purple} /> : <ScanLine size={20} color={colors.purple} />}
                                </View>
                                <View style={styles.copy}>
                                    <Text style={styles.label}>{persona?.label ?? (fitChecks >= milestone ? 'Style profile pending' : 'Discover your style persona')}</Text>
                                    <Text style={styles.body}>{persona?.desc ?? (fitChecks >= milestone ? 'Your Fit Check history is ready for a style analysis.' : 'Complete 10 Fit Checks to unlock your style persona.')}</Text>
                                </View>
                            </View>
                            {!persona && fitChecks < milestone && (
                                <View accessible accessibilityRole="progressbar" accessibilityLabel="Fit Checks toward Style DNA" accessibilityValue={{ min: 0, max: milestone, now: fitChecks }} style={styles.track}>
                                    <View style={[styles.fill, { width: `${fitChecks * 10}%` }]} />
                                </View>
                            )}
                            <Text style={styles.count}>{!persona && fitChecks < milestone ? `${fitChecks} of ${milestone} Fit Checks` : `${fitChecks} Fit Checks completed`}</Text>
                        </View>
                    </View>
                )}
            </View>
            {!!user?.stylePrefs.length && (
                <View style={styles.section}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>Style preferences</Text>
                    <View style={styles.swatches}>
                        {user.stylePrefs.map((preference) => <View key={preference} style={styles.badge}><Text style={styles.actionText}>{preference}</Text></View>)}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Theme.colors.background.light },
    page: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 34 : 16, gap: 20 },
    title: { fontFamily: FontFamily.bold, fontSize: 34, letterSpacing: -1, color: colors.ink },
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, borderCurve: 'continuous' },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    avatar: { width: 52, height: 52, borderRadius: 17, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint, overflow: 'hidden' },
    copy: { flex: 1, gap: 3 },
    name: { fontFamily: FontFamily.bold, fontSize: 21, color: colors.ink },
    badge: { backgroundColor: colors.tint, borderRadius: 10, borderCurve: 'continuous', paddingVertical: 6, paddingHorizontal: 10, flexShrink: 1 },
    sections: { gap: 20 },
    sectionsWide: { flexDirection: 'row', alignItems: 'flex-start' },
    section: { flex: 1, minWidth: 0, gap: 9 },
    sectionTitle: { fontFamily: FontFamily.bold, fontSize: 22, letterSpacing: -0.4, color: colors.ink },
    row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
    divider: { borderTopWidth: 1, borderTopColor: colors.border },
    icon: { width: 42, height: 42, borderRadius: 13, borderCurve: 'continuous', backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: FontFamily.bold, fontSize: 16, color: colors.ink },
    body: { fontFamily: FontFamily.regular, fontSize: 14, color: colors.secondary },
    panel: { padding: 14, gap: 12 },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    track: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.tint },
    fill: { height: '100%', backgroundColor: colors.purple },
    count: { fontFamily: FontFamily.semibold, fontSize: 13, fontVariant: ['tabular-nums'], color: colors.secondary },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 3 },
    swatch: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    actionText: { fontFamily: FontFamily.semibold, fontSize: 13, color: colors.purple },
    retry: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
    pressed: { opacity: 0.72 },
});
