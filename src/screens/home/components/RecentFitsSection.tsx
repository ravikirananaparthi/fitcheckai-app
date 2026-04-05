import { Theme } from '@constants/theme';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LIME = Theme.palette.primary;
const DARK = Theme.palette.surface.dark;
const TEXT = Theme.colors.text.inverse;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

// ---------------------------------------------------------------------------
// FitCard
// ---------------------------------------------------------------------------
interface FitCardProps {
    score: number;
    label: string;
    date: string;
    imagePlaceholderColor: string;
}

function FitCard({ score, label, date, imagePlaceholderColor }: FitCardProps) {
    return (
        <View style={styles.fitCard}>
            <View style={[styles.fitCardImage, { backgroundColor: imagePlaceholderColor }]} />
            <View style={styles.scoreBadge}>
                <Text style={styles.scoreBadgeText}>{score}</Text>
            </View>
            <View style={styles.fitCardLabel}>
                <Text style={styles.fitCardLabelText}>{label}</Text>
                <Text style={styles.fitCardDate}>{date}</Text>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// RecentFitsSection
// ---------------------------------------------------------------------------
export default function RecentFitsSection() {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Fits</Text>
                <Pressable>
                    <Text style={styles.sectionViewAll}>View All</Text>
                </Pressable>
            </View>
            <View style={styles.fitCardsRow}>
                <FitCard score={9.2} label="Street Core" date="Yesterday" imagePlaceholderColor="#3A3A3A" />
                <FitCard score={8.5} label="Office Chic" date="2 days ago" imagePlaceholderColor="#555566" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: TEXT,
    },
    sectionViewAll: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555555',
    },
    fitCardsRow: {
        flexDirection: 'row',
        gap: CARD_GAP,
    },
    fitCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.4,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: DARK,
    },
    fitCardImage: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    scoreBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: LIME,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    scoreBadgeText: {
        fontSize: 13,
        fontWeight: '800',
        color: DARK,
    },
    fitCardLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingTop: 24,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    fitCardLabelText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    fitCardDate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 2,
    },
});
