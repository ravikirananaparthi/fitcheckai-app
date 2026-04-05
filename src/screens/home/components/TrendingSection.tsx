import { Theme } from '@constants/theme';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DARK = Theme.palette.surface.dark;
const TEXT = Theme.colors.text.inverse;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

// ---------------------------------------------------------------------------
// TrendingCard
// ---------------------------------------------------------------------------
interface TrendingCardProps {
    label: string;
    imagePlaceholderColor: string;
}

function TrendingCard({ label, imagePlaceholderColor }: TrendingCardProps) {
    return (
        <View style={styles.trendingCard}>
            <View style={[styles.trendingCardImage, { backgroundColor: imagePlaceholderColor }]} />
            <View style={styles.trendingCardLabel}>
                <Text style={styles.trendingCardLabelText}>{label}</Text>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// TrendingSection
// ---------------------------------------------------------------------------
export default function TrendingSection() {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending for You</Text>
            <View style={styles.cardsRow}>
                <TrendingCard label="MINIMALIST FALL" imagePlaceholderColor="#D4C5A9" />
                <TrendingCard label="URBAN TECH" imagePlaceholderColor="#2E2E3A" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: TEXT,
        marginBottom: 12,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: CARD_GAP,
    },
    trendingCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.25,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: DARK,
    },
    trendingCardImage: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    trendingCardLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    trendingCardLabelText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
});
