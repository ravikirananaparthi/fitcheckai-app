import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { getItemCombos } from '@/src/services/api/wardrobe.service';
import type { ClothingItem, OutfitCombo } from '@/src/types/wardrobe.types';

const LIME = Theme.palette.primary;

const OCCASION_EMOJI: Record<string, string> = {
    CASUAL: '👟',
    FORMAL: '🎩',
    WORK: '💼',
    PARTY: '🎉',
    DATE: '❤️',
    BEACH: '🏖️',
    SPORT: '🏃',
    SLEEP: '😴',
};

const SEASON_EMOJI: Record<string, string> = {
    SPRING: '🌸',
    SUMMER: '☀️',
    AUTUMN: '🍂',
    WINTER: '❄️',
    ALL_SEASON: '🔄',
};

interface Props {
    item: ClothingItem;
    onBack: () => void;
    onGetCombos: (item: ClothingItem, combos: OutfitCombo[]) => void;
    onArchive: (item: ClothingItem) => void;
}

export function ItemDetailScreen({ item, onBack, onGetCombos, onArchive }: Props) {
    const insets = useSafeAreaInsets();
    const [combosLoading, setCombosLoading] = useState(false);

    const handleGetCombos = async () => {
        try {
            setCombosLoading(true);
            const result = await getItemCombos(item.id);
            onGetCombos(item, result.combos ?? []);
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not load outfit combos. Make sure you have other items in your wardrobe.');
        } finally {
            setCombosLoading(false);
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
                <TouchableOpacity
                    onPress={() => onArchive(item)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.archiveBtn}>Archive</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            >
                <Animated.View entering={FadeIn}>
                    {/* Image */}
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />

                    {/* Info card */}
                    <View style={styles.infoCard}>
                        <View style={styles.labelRow}>
                            <Text style={styles.itemLabel}>{item.label}</Text>
                            <View style={[styles.categoryBadge, { backgroundColor: categoryColor(item.category) }]}>
                                <Text style={styles.categoryBadgeText}>{item.category}</Text>
                            </View>
                        </View>

                        {/* Colors */}
                        {item.colors.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Colors</Text>
                                <View style={styles.chipRow}>
                                    {item.colors.map((c) => (
                                        <View key={c} style={styles.chip}>
                                            <Text style={styles.chipText}>{c}</Text>
                                        </View>
                                    ))}
                                    {item.pattern && (
                                        <View style={[styles.chip, styles.chipPattern]}>
                                            <Text style={styles.chipText}>{item.pattern}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Occasions */}
                        {item.occasions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Occasions</Text>
                                <View style={styles.chipRow}>
                                    {item.occasions.map((o) => (
                                        <View key={o} style={[styles.chip, styles.chipOccasion]}>
                                            <Text style={styles.chipText}>
                                                {OCCASION_EMOJI[o] ?? '•'} {o.toLowerCase()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Seasons */}
                        {item.seasons.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Seasons</Text>
                                <View style={styles.chipRow}>
                                    {item.seasons.map((s) => (
                                        <View key={s} style={[styles.chip, styles.chipSeason]}>
                                            <Text style={styles.chipText}>
                                                {SEASON_EMOJI[s] ?? '•'} {s.toLowerCase().replace('_', ' ')}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Tags */}
                        {item.tags.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Style Tags</Text>
                                <View style={styles.chipRow}>
                                    {item.tags.map((t) => (
                                        <View key={t} style={[styles.chip, styles.chipTag]}>
                                            <Text style={styles.chipText}># {t}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {item.notes && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Notes</Text>
                                <Text style={styles.notesText}>{item.notes}</Text>
                            </View>
                        )}
                    </View>

                    {/* AI Combos CTA */}
                    <TouchableOpacity
                        style={styles.combosBtn}
                        onPress={handleGetCombos}
                        disabled={combosLoading}
                        activeOpacity={0.85}
                    >
                        {combosLoading ? (
                            <ActivityIndicator size="small" color="#111" />
                        ) : (
                            <Text style={styles.combosBtnText}>✨ Get AI Outfit Combos</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.comboHint}>
                        AI will suggest 3 outfits using items already in your wardrobe.
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

function categoryColor(cat: string): string {
    const map: Record<string, string> = {
        TOPS: '#4A9EFF',
        BOTTOMS: '#9B59B6',
        SHOES: '#E67E22',
        ACCESSORIES: '#E91E8C',
        OUTERWEAR: '#2ECC71',
        DRESSES: '#F39C12',
        ACTIVEWEAR: '#1ABC9C',
        OTHER: '#95A5A6',
    };
    return map[cat] ?? '#95A5A6';
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
    },
    backBtn: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    archiveBtn: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: '#E53935',
    },
    scroll: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    heroImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: Theme.radius.xxl,
        backgroundColor: Theme.colors.border,
    },
    infoCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    itemLabel: {
        flex: 1,
        fontSize: 20,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Theme.radius.full,
        flexShrink: 0,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#FFF',
        letterSpacing: 0.3,
    },
    section: {
        gap: 6,
    },
    sectionLabel: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.secondary,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Theme.radius.full,
        backgroundColor: '#F0F0F0',
    },
    chipPattern: {
        backgroundColor: '#F3E5F5',
    },
    chipOccasion: {
        backgroundColor: '#E8F5E9',
    },
    chipSeason: {
        backgroundColor: '#E3F2FD',
    },
    chipTag: {
        backgroundColor: '#FFF8E1',
    },
    chipText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: '#444',
    },
    notesText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        lineHeight: 20,
    },
    combosBtn: {
        backgroundColor: LIME,
        borderRadius: Theme.radius.xl,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    combosBtnText: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    comboHint: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: 6,
    },
});
