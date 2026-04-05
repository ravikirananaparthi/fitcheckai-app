import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { createOutfit } from '@/src/services/api/outfits.service';
import type { ClothingItem, OutfitCombo } from '@/src/types/wardrobe.types';

const LIME = Theme.palette.primary;

const OCCASION_COLORS: Record<string, { bg: string; text: string }> = {
    casual: { bg: '#E8F5E9', text: '#2E7D32' },
    formal: { bg: '#E3F2FD', text: '#1565C0' },
    work: { bg: '#FFF3E0', text: '#E65100' },
    party: { bg: '#F3E5F5', text: '#6A1B9A' },
    date: { bg: '#FCE4EC', text: '#880E4F' },
    beach: { bg: '#E0F7FA', text: '#00695C' },
    sport: { bg: '#F1F8E9', text: '#33691E' },
};

interface Props {
    item: ClothingItem;
    combos: OutfitCombo[];
    allItems: ClothingItem[];
    onBack: () => void;
}

export function OutfitCombosScreen({ item, combos, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState<number | null>(null);
    const [saved, setSaved] = useState<Set<number>>(new Set());

    const handleSaveOutfit = async (combo: OutfitCombo, index: number) => {
        try {
            setSaving(index);
            // We save the outfit by name — items are label strings from AI, not IDs
            // The backend `createOutfit` needs itemIds, but AI combos give labels.
            // For now, save as outfit with just name + occasion (no itemIds linkage since AI uses labels)
            await createOutfit(combo.name, [], combo.occasion);
            setSaved((prev) => new Set(prev).add(index));
            Alert.alert('Saved!', `"${combo.name}" has been saved to your outfits.`);
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not save outfit.');
        } finally {
            setSaving(null);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            >
                <Animated.View entering={FadeIn} style={styles.heroSection}>
                    <Text style={styles.heroEmoji}>✨</Text>
                    <Text style={styles.title}>Outfit Combos</Text>
                    <Text style={styles.subtitle}>
                        3 ways to style your{' '}
                        <Text style={styles.subtitleBold}>{item.label}</Text>
                        {' '}using items from your wardrobe
                    </Text>
                </Animated.View>

                {combos.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            No combos found. Add more items to your wardrobe to get outfit suggestions.
                        </Text>
                    </View>
                ) : (
                    combos.map((combo, i) => {
                        const occasionKey = combo.occasion?.toLowerCase() ?? '';
                        const colors = OCCASION_COLORS[occasionKey] ?? { bg: '#F5F5F5', text: '#555' };
                        const isSaved = saved.has(i);

                        return (
                            <Animated.View
                                key={i}
                                entering={FadeInDown.delay(i * 100)}
                                style={styles.comboCard}
                            >
                                <View style={styles.comboHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.comboName}>{combo.name}</Text>
                                        <View style={[styles.occasionBadge, { backgroundColor: colors.bg }]}>
                                            <Text style={[styles.occasionText, { color: colors.text }]}>
                                                {combo.occasion}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.comboIndex}>{i + 1}</Text>
                                </View>

                                {/* Items list */}
                                <View style={styles.itemsList}>
                                    {combo.items.map((itemName, j) => (
                                        <View key={j} style={styles.itemRow}>
                                            <View style={styles.itemDot} />
                                            <Text style={styles.itemName}>{itemName}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Save button */}
                                <TouchableOpacity
                                    style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
                                    onPress={() => !isSaved && handleSaveOutfit(combo, i)}
                                    disabled={isSaved || saving === i}
                                    activeOpacity={0.85}
                                >
                                    {saving === i ? (
                                        <ActivityIndicator size="small" color="#111" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>
                                            {isSaved ? '✓ Saved to Outfits' : 'Save as Outfit'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    topBar: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
    },
    backBtn: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    scroll: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
        gap: 6,
    },
    heroEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    subtitleBold: {
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.colors.text.primary,
    },
    emptyState: {
        padding: Theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    comboCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    comboHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Theme.spacing.sm,
    },
    comboIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: LIME,
        textAlign: 'center',
        lineHeight: 32,
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
        flexShrink: 0,
    },
    comboName: {
        fontSize: 17,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
        marginBottom: 4,
    },
    occasionBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Theme.radius.full,
    },
    occasionText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        textTransform: 'capitalize',
    },
    itemsList: {
        gap: 6,
        paddingLeft: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: LIME,
        flexShrink: 0,
    },
    itemName: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
    },
    saveBtn: {
        backgroundColor: LIME,
        borderRadius: Theme.radius.lg,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    saveBtnSaved: {
        backgroundColor: '#E8F5E9',
    },
    saveBtnText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
});
