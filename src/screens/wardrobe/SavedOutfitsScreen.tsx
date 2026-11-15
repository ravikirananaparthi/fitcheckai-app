import { fitCheckColors as colors } from '@/constants/fitcheck-colors';
import { FlashList } from '@shopify/flash-list';
import { Layers } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { getOutfits, deleteOutfit } from '@/src/services/api/outfits.service';
import type { Outfit, ClothingItem } from '@/src/types/wardrobe.types';

const accent = colors.purple;

interface Props {
    allItems: ClothingItem[];
    onBack: () => void;
}

export function SavedOutfitsScreen({ allItems, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOutfits();
            setOutfits(data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = useCallback((outfit: Outfit) => {
        Alert.alert('Delete outfit?', `"${outfit.name}" will be permanently deleted.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteOutfit(outfit.id);
                        setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
                    } catch (err: any) {
                        Alert.alert('Error', err?.message ?? 'Could not delete outfit.');
                    }
                },
            },
        ]);
    }, []);

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity accessibilityRole="button" onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.backBtn}>← Wardrobe</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.headerTitle}>Saved outfits</Text>
                <Text style={styles.headerSub}>{outfits.length} outfit{outfits.length !== 1 ? 's' : ''}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={accent} />
                </View>
            ) : outfits.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyState}>
                    <View style={styles.emptyIcon}><Layers size={24} color={colors.purple} /></View>
                    <Text style={styles.emptyTitle}>No saved outfits yet</Text>
                    <Text style={styles.emptySub}>
                        Save a look from the outfit builder or from a piece’s outfit suggestions.
                    </Text>
                </Animated.View>
            ) : (
                <FlashList
                    data={outfits}
                    keyExtractor={(o) => o.id}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
                    renderItem={({ item: outfit, index }) => (
                        <OutfitCard
                            outfit={outfit}
                            allItems={allItems}
                            index={index}
                            onDelete={() => handleDelete(outfit)}
                        />
                    )}
                />
            )}
        </View>
    );
}

// ─── Outfit card ──────────────────────────────────────────────────────────────

function OutfitCard({
    outfit,
    allItems,
    index,
    onDelete,
}: {
    outfit: Outfit;
    allItems: ClothingItem[];
    index: number;
    onDelete: () => void;
}) {
    // Get items from outfit.items (populated from backend) or match from allItems
    const itemsToShow = (outfit.items ?? []).flatMap(({ clothingItem }) => {
        const item = allItems.find((piece) => piece.id === clothingItem?.id) ?? clothingItem;
        return item ? [item] : [];
    });

    const lastWorn =
        outfit.wornDates?.length > 0
            ? new Date(outfit.wornDates[outfit.wornDates.length - 1]).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
              })
            : null;

    return (
        <Animated.View entering={FadeInDown.delay(index * 80)} style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.outfitName}>{outfit.name}</Text>
                    <View style={styles.outfitMeta}>
                        {outfit.occasion && (
                            <View style={styles.occasionChip}>
                                <Text style={styles.occasionChipText}>{outfit.occasion}</Text>
                            </View>
                        )}
                        {lastWorn && (
                            <Text style={styles.wornText}>Last worn: {lastWorn}</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onDelete}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.deleteBtn}>🗑</Text>
                </TouchableOpacity>
            </View>

            {/* Item thumbnails */}
            {itemsToShow.length > 0 && (
                <View style={styles.thumbRow}>
                    {itemsToShow.slice(0, 5).map((item, i) => (
                        <Image
                            key={i}
                            source={{ uri: (item as ClothingItem).thumbnailUrl ?? (item as ClothingItem).imageUrl }}
                            style={styles.outfitThumb}
                            contentFit="cover"
                        />
                    ))}
                    {itemsToShow.length > 5 && (
                        <View style={[styles.outfitThumb, styles.moreBadge]}>
                            <Text style={styles.moreText}>+{itemsToShow.length - 5}</Text>
                        </View>
                    )}
                </View>
            )}

            {outfit.notes && (
                <Text style={styles.outfitNotes} numberOfLines={2}>{outfit.notes}</Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
    },
    topBar: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
    },
    backBtn: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: colors.purple,
    },
    header: {
        paddingHorizontal: Theme.spacing.md,
        paddingBottom: Theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: colors.ink,
    },
    headerSub: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: colors.secondary,
        marginTop: 2,
    },
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Theme.spacing.xl,
        gap: Theme.spacing.sm,
    },
    emptyIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: colors.ink,
    },
    emptySub: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: colors.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    list: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    outfitCard: {
        backgroundColor: colors.surface,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    outfitHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Theme.spacing.sm,
    },
    outfitName: {
        fontSize: 17,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: colors.ink,
    },
    outfitMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    occasionChip: {
        backgroundColor: colors.tint,
        borderRadius: Theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: accent,
    },
    occasionChipText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: colors.purple,
        textTransform: 'capitalize',
    },
    wornText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: colors.secondary,
    },
    deleteBtn: {
        fontSize: 18,
        opacity: 0.6,
    },
    thumbRow: {
        flexDirection: 'row',
        gap: 6,
    },
    outfitThumb: {
        width: 56,
        height: 70,
        borderRadius: Theme.radius.md,
        backgroundColor: colors.border,
    },
    moreBadge: {
        backgroundColor: colors.tint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: colors.secondary,
    },
    outfitNotes: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: colors.secondary,
        lineHeight: 18,
    },
});
