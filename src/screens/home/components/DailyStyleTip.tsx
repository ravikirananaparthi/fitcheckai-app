import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDailyStyleTip } from '@/src/services/api/fitcheck.service';

const LIME = Theme.palette.primary;
const DARK = Theme.palette.surface.dark;
const TEXT = Theme.colors.text.inverse;

export default function DailyStyleTip() {
    const { data: tip, isLoading } = useQuery({
        queryKey: ['style-tip', 'daily'],
        queryFn: getDailyStyleTip,
        staleTime: 1000 * 60 * 60, // 1 hour — tip only changes daily
        retry: 1,
    });

    return (
        <View style={styles.tipCard}>
            <View style={styles.tipRow}>
                <View style={styles.tipIconCircle}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={16} color={DARK} />
                </View>
                <View style={styles.tipTextBlock}>
                    <View style={styles.tipHeaderRow}>
                        <Text style={styles.tipLabel}>DAILY STYLE TIP</Text>
                        {tip && (
                            <Text style={styles.tipCategory}>
                                {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                            </Text>
                        )}
                    </View>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={LIME} style={{ marginTop: 8 }} />
                    ) : (
                        <Text style={styles.tipBody}>
                            {tip?.content ?? 'Style tip of the day loading...'}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tipCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    tipRow: {
        flexDirection: 'row',
        gap: 12,
    },
    tipIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: LIME,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    tipTextBlock: {
        flex: 1,
    },
    tipHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    tipLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: TEXT,
        letterSpacing: 0.8,
    },
    tipCategory: {
        fontSize: 11,
        color: '#888888',
        fontStyle: 'italic',
    },
    tipBody: {
        fontSize: 13,
        color: '#444444',
        lineHeight: 20,
    },
});
