import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface Props {
    score: number; // 1–10
}

export function ScoreRing({ score }: Props) {
    const color =
        score >= 8 ? '#4CAF50' :
        score >= 6 ? Theme.palette.primary :
        score >= 4 ? '#FF9800' : '#F44336';

    const label =
        score >= 8 ? 'Excellent' :
        score >= 6 ? 'Good' :
        score >= 4 ? 'Okay' : 'Needs Work';

    return (
        <View style={styles.container}>
            <View style={[styles.ring, { borderColor: color }]}>
                <Text style={[styles.score, { color }]}>{score.toFixed(1)}</Text>
                <Text style={styles.ten}>/10</Text>
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 8,
    },
    ring: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        gap: 2,
    },
    score: {
        fontSize: 28,
        fontFamily: 'GoogleSansFlex_700Bold',
    },
    ten: {
        fontSize: 14,
        color: Theme.colors.text.secondary,
        fontFamily: 'GoogleSansFlex_400Regular',
        alignSelf: 'flex-end',
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
