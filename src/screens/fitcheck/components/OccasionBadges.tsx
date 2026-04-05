import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import type { FitCheckFeedback } from '@/src/types/fitcheck.types';

interface Props {
    occasions: FitCheckFeedback['occasions'];
}

const OCCASION_LABELS: Record<string, string> = {
    casual: 'Casual',
    work: 'Office',
    date: 'Date',
    party: 'Party',
    beach: 'Beach',
};

export function OccasionBadges({ occasions }: Props) {
    return (
        <View style={styles.row}>
            {Object.entries(occasions).map(([key, suitable]) => (
                <View
                    key={key}
                    style={[styles.badge, suitable ? styles.active : styles.inactive]}
                >
                    <Text style={[styles.text, suitable ? styles.activeText : styles.inactiveText]}>
                        {suitable ? '✓' : '✗'} {OCCASION_LABELS[key] ?? key}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Theme.radius.full,
        borderWidth: 1.5,
    },
    active: {
        backgroundColor: Theme.palette.primary + '22',
        borderColor: Theme.palette.primary,
    },
    inactive: {
        backgroundColor: 'transparent',
        borderColor: Theme.colors.border,
    },
    text: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_500Medium',
    },
    activeText: {
        color: Theme.palette.primaryDark,
    },
    inactiveText: {
        color: Theme.colors.text.secondary,
    },
});
