import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { ScoreRing } from './components/ScoreRing';
import { OccasionBadges } from './components/OccasionBadges';
import type { FitCheck } from '@/src/types/fitcheck.types';

interface Props {
    fitCheck: FitCheck;
    onChatPress: () => void;
    onNewCheck: () => void;
}

export function FitCheckResultScreen({ fitCheck, onChatPress, onNewCheck }: Props) {
    const insets = useSafeAreaInsets();
    const fb = fitCheck.feedback;

    if (!fb) return null;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNewCheck} style={styles.backBtn}>
                    <Text style={styles.backText}>← New Check</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Fit Check</Text>
                <View style={{ width: 90 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
            >
                {/* Hero — photo + score */}
                <View style={styles.heroRow}>
                    <Image
                        source={{ uri: fitCheck.imageUrl }}
                        style={styles.outfitImage}
                        resizeMode="cover"
                    />
                    <View style={styles.scoreSection}>
                        <ScoreRing score={fb.score} />
                        <View style={styles.styleCategoryPill}>
                            <Text style={styles.styleCategoryText}>{fb.styleCategory}</Text>
                        </View>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.card}>
                    <Text style={styles.summaryText}>{fb.summary}</Text>
                </View>

                {/* What Works */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>✅</Text>
                        <Text style={styles.sectionTitle}>What Works</Text>
                    </View>
                    {fb.whatWorks.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Improve This */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>💡</Text>
                        <Text style={styles.sectionTitle}>Improve This</Text>
                    </View>
                    {fb.improve.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <View style={[styles.bullet, { backgroundColor: '#FF9800' }]} />
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Occasions */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📍</Text>
                        <Text style={styles.sectionTitle}>Wear It To</Text>
                    </View>
                    <OccasionBadges occasions={fb.occasions} />
                </View>

                {/* Accessories */}
                {fb.accessories.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>✨</Text>
                            <Text style={styles.sectionTitle}>Add These</Text>
                        </View>
                        <View style={styles.accessoryRow}>
                            {fb.accessories.map((item, i) => (
                                <View key={i} style={styles.accessoryPill}>
                                    <Text style={styles.accessoryText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Sticky CTA */}
            <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.chatBtn} onPress={onChatPress} activeOpacity={0.85}>
                    <Text style={styles.chatBtnText}>💬  Chat with AI Stylist</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backBtn: {
        paddingVertical: 4,
        width: 90,
    },
    backText: {
        fontSize: 14,
        color: Theme.palette.primary,
        fontFamily: 'GoogleSansFlex_500Medium',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    scroll: {
        padding: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    heroRow: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        alignItems: 'center',
    },
    outfitImage: {
        width: 140,
        height: 180,
        borderRadius: Theme.radius.xl,
        backgroundColor: Theme.colors.border,
    },
    scoreSection: {
        flex: 1,
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    styleCategoryPill: {
        backgroundColor: Theme.palette.primary + '33',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: Theme.radius.full,
    },
    styleCategoryText: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    card: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    summaryText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.primary,
        lineHeight: 22,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionIcon: {
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        flexShrink: 0,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.primary,
        lineHeight: 20,
    },
    accessoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    accessoryPill: {
        backgroundColor: Theme.palette.muted,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Theme.radius.full,
    },
    accessoryText: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: Theme.palette.primaryDark,
    },
    ctaBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.sm,
        backgroundColor: Theme.colors.background.light,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    chatBtn: {
        backgroundColor: Theme.palette.primary,
        borderRadius: Theme.radius.xl,
        paddingVertical: 16,
        alignItems: 'center',
    },
    chatBtnText: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111111',
    },
});
