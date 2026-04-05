import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, FlatList, ActivityIndicator, Alert,
    ScrollView, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import {
    getWardrobeItems,
    addWardrobeItem,
    archiveWardrobeItem,
    getGapAnalysis,
} from '@/src/services/api/wardrobe.service';
import { ItemDetailScreen } from './ItemDetailScreen';
import { OutfitCombosScreen } from './OutfitCombosScreen';
import { OutfitBuilderScreen } from './OutfitBuilderScreen';
import { SavedOutfitsScreen } from './SavedOutfitsScreen';
import type { ClothingItem, ClothingCategory, OutfitCombo, GapItem } from '@/src/types/wardrobe.types';

const LIME = Theme.palette.primary;

const CATEGORIES: { label: string; value: ClothingCategory | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Tops', value: 'TOPS' },
    { label: 'Bottoms', value: 'BOTTOMS' },
    { label: 'Shoes', value: 'SHOES' },
    { label: 'Dresses', value: 'DRESSES' },
    { label: 'Outerwear', value: 'OUTERWEAR' },
    { label: 'Accessories', value: 'ACCESSORIES' },
    { label: 'Active', value: 'ACTIVEWEAR' },
];

type ScreenState =
    | { view: 'grid' }
    | { view: 'addingItem'; imageUri: string }      // uploading + AI tagging
    | { view: 'confirmItem'; item: ClothingItem }   // show AI tags, confirm
    | { view: 'itemDetail'; item: ClothingItem }
    | { view: 'combos'; item: ClothingItem; combos: OutfitCombo[] }
    | { view: 'outfitBuilder' }
    | { view: 'savedOutfits' };

export default function WardrobeScreen() {
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<ScreenState>({ view: 'grid' });
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [category, setCategory] = useState<ClothingCategory | 'ALL'>('ALL');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [gaps, setGaps] = useState<GapItem[]>([]);
    const [gapsLoading, setGapsLoading] = useState(false);

    const loadItems = useCallback(async (cat: ClothingCategory | 'ALL' = category) => {
        try {
            setLoading(true);
            const data = await getWardrobeItems(cat === 'ALL' ? undefined : cat);
            setItems(data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [category]);

    const loadGaps = useCallback(async () => {
        if (items.length < 5) return;
        try {
            setGapsLoading(true);
            const data = await getGapAnalysis();
            setGaps(data.gaps ?? []);
        } catch {
            // non-critical
        } finally {
            setGapsLoading(false);
        }
    }, [items.length]);

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        if (items.length >= 5) loadGaps();
    }, [items.length]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadItems(category);
        setRefreshing(false);
    }, [category, loadItems]);

    const onCategoryChange = useCallback((cat: ClothingCategory | 'ALL') => {
        setCategory(cat);
        loadItems(cat);
    }, [loadItems]);

    const pickAndAdd = useCallback(async (source: 'camera' | 'gallery') => {
        const permission =
            source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Permission needed', `Please allow ${source} access in Settings.`);
            return;
        }

        const result =
            source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.85,
                      allowsEditing: true,
                      aspect: [3, 4],
                  })
                : await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.85,
                      allowsEditing: true,
                      aspect: [3, 4],
                  });

        if (result.canceled || !result.assets[0]) return;

        const imageUri = result.assets[0].uri;
        setState({ view: 'addingItem', imageUri });

        try {
            const item = await addWardrobeItem(imageUri);
            setState({ view: 'confirmItem', item });
            setItems((prev) => [item, ...prev]);
        } catch (err: any) {
            Alert.alert('Failed to add item', err?.message ?? 'Please try again.');
            setState({ view: 'grid' });
        }
    }, []);

    const onArchive = useCallback(async (item: ClothingItem) => {
        Alert.alert('Archive item?', `"${item.label}" will be removed from your wardrobe.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Archive',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await archiveWardrobeItem(item.id);
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                        setState({ view: 'grid' });
                    } catch (err: any) {
                        Alert.alert('Error', err?.message ?? 'Could not archive item.');
                    }
                },
            },
        ]);
    }, []);

    // ─── Sub-screen renders ──────────────────────────────────────────────────

    if (state.view === 'itemDetail') {
        return (
            <ItemDetailScreen
                item={state.item}
                onBack={() => setState({ view: 'grid' })}
                onGetCombos={(item, combos) => setState({ view: 'combos', item, combos })}
                onArchive={onArchive}
            />
        );
    }

    if (state.view === 'combos') {
        return (
            <OutfitCombosScreen
                item={state.item}
                combos={state.combos}
                onBack={() => setState({ view: 'itemDetail', item: state.item })}
                allItems={items}
            />
        );
    }

    if (state.view === 'outfitBuilder') {
        return (
            <OutfitBuilderScreen
                items={items}
                onBack={() => setState({ view: 'grid' })}
            />
        );
    }

    if (state.view === 'savedOutfits') {
        return (
            <SavedOutfitsScreen
                onBack={() => setState({ view: 'grid' })}
                allItems={items}
            />
        );
    }

    // ─── Adding item states ──────────────────────────────────────────────────

    if (state.view === 'addingItem') {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Adding Item</Text>
                </View>
                <Animated.View entering={FadeIn} style={styles.taggingCard}>
                    <Image
                        source={{ uri: state.imageUri }}
                        style={styles.taggingImage}
                        resizeMode="cover"
                    />
                    <View style={styles.taggingOverlay}>
                        <ActivityIndicator size="large" color={LIME} />
                        <Text style={styles.taggingTitle}>AI is tagging your item...</Text>
                        <Text style={styles.taggingSubtitle}>
                            Gemini is identifying the type, colors, and occasions.
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    if (state.view === 'confirmItem') {
        const item = state.item;
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setState({ view: 'grid' })}>
                        <Text style={styles.backBtn}>← Done</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeIn} style={styles.confirmCard}>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.confirmImage}
                            resizeMode="cover"
                        />
                        <View style={styles.confirmInfo}>
                            <View style={styles.confirmBadge}>
                                <Text style={styles.confirmBadgeText}>AI Tagged</Text>
                            </View>
                            <Text style={styles.confirmLabel}>{item.label}</Text>
                            <View style={styles.tagRow}>
                                <View style={[styles.chip, styles.chipCategory]}>
                                    <Text style={styles.chipTextDark}>{item.category}</Text>
                                </View>
                                {item.colors.map((c) => (
                                    <View key={c} style={styles.chip}>
                                        <Text style={styles.chipText}>{c}</Text>
                                    </View>
                                ))}
                            </View>
                            {item.occasions.length > 0 && (
                                <View style={styles.tagRow}>
                                    {item.occasions.map((o) => (
                                        <View key={o} style={[styles.chip, styles.chipOccasion]}>
                                            <Text style={styles.chipText}>{o.toLowerCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {item.seasons.length > 0 && (
                                <View style={styles.tagRow}>
                                    {item.seasons.map((s) => (
                                        <View key={s} style={[styles.chip, styles.chipSeason]}>
                                            <Text style={styles.chipText}>{s.toLowerCase().replace('_', ' ')}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => setState({ view: 'itemDetail', item })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.doneBtnText}>View Item →</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    // ─── Main grid view ──────────────────────────────────────────────────────

    const filteredItems = items; // filtering done server-side on category change

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Wardrobe</Text>
                    <Text style={styles.headerSub}>{items.length} items</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setState({ view: 'savedOutfits' })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.headerBtnText}>Outfits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            Alert.alert('Add Item', 'Choose a source', [
                                { text: 'Camera', onPress: () => pickAndAdd('camera') },
                                { text: 'Gallery', onPress: () => pickAndAdd('gallery') },
                                { text: 'Cancel', style: 'cancel' },
                            ]);
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.addBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={styles.catContent}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[styles.catTab, category === cat.value && styles.catTabActive]}
                        onPress={() => onCategoryChange(cat.value)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.catTabText, category === cat.value && styles.catTabTextActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Grid */}
            {loading && items.length === 0 ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={LIME} />
                </View>
            ) : filteredItems.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👗</Text>
                    <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
                    <Text style={styles.emptySub}>Tap + to add your first clothing item.</Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => {
                            Alert.alert('Add Item', 'Choose a source', [
                                { text: 'Camera', onPress: () => pickAndAdd('camera') },
                                { text: 'Gallery', onPress: () => pickAndAdd('gallery') },
                                { text: 'Cancel', style: 'cancel' },
                            ]);
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.emptyBtnText}>Add Item</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <FlatList
                    data={filteredItems}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 120 }]}
                    columnWrapperStyle={styles.gridRow}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIME} />
                    }
                    ListFooterComponent={
                        items.length >= 5 ? (
                            <GapAnalysisCard gaps={gaps} loading={gapsLoading} />
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemCard}
                            onPress={() => setState({ view: 'itemDetail', item })}
                            activeOpacity={0.85}
                        >
                            <Image
                                source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
                                style={styles.itemThumb}
                                resizeMode="cover"
                            />
                            <View style={styles.itemMeta}>
                                <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
                                <View style={[styles.catDot, { backgroundColor: categoryColor(item.category) }]} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Build Outfit FAB */}
            {items.length >= 2 && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 90 }]}
                    onPress={() => setState({ view: 'outfitBuilder' })}
                    activeOpacity={0.9}
                >
                    <Text style={styles.fabText}>Build Outfit</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Gap Analysis Card ────────────────────────────────────────────────────────

function GapAnalysisCard({ gaps, loading }: { gaps: GapItem[]; loading: boolean }) {
    if (loading) {
        return (
            <View style={styles.gapCard}>
                <Text style={styles.gapTitle}>Wardrobe Gap Analysis</Text>
                <ActivityIndicator size="small" color={LIME} style={{ marginTop: 8 }} />
            </View>
        );
    }
    if (gaps.length === 0) return null;
    return (
        <View style={styles.gapCard}>
            <Text style={styles.gapTitle}>What You're Missing</Text>
            <Text style={styles.gapSubtitle}>AI analysis of your wardrobe gaps</Text>
            {gaps.map((gap, i) => (
                <View key={i} style={styles.gapRow}>
                    <View style={styles.gapDot} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.gapItem}>{gap.item}</Text>
                        <Text style={styles.gapReason}>{gap.reason}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(cat: ClothingCategory): string {
    const map: Record<ClothingCategory, string> = {
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.sm,
        paddingBottom: Theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    headerSub: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        marginTop: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    headerBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Theme.radius.xl,
        borderWidth: 1.5,
        borderColor: LIME,
    },
    headerBtnText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    addBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: LIME,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        fontSize: 24,
        color: '#111',
        lineHeight: 28,
        fontFamily: 'GoogleSansFlex_700Bold',
    },
    backBtn: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    catScroll: {
        flexGrow: 0,
        marginBottom: Theme.spacing.sm,
    },
    catContent: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.xs,
    },
    catTab: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.background.surface.light,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    catTabActive: {
        backgroundColor: LIME,
        borderColor: LIME,
    },
    catTabText: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.colors.text.secondary,
    },
    catTabTextActive: {
        color: '#111',
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
    emptyEmoji: { fontSize: 56 },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    emptySub: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
    },
    emptyBtn: {
        marginTop: Theme.spacing.sm,
        backgroundColor: LIME,
        borderRadius: Theme.radius.xl,
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    emptyBtnText: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    gridContent: {
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.xs,
        gap: Theme.spacing.sm,
    },
    gridRow: {
        gap: Theme.spacing.sm,
    },
    itemCard: {
        flex: 1,
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.background.surface.light,
        ...Theme.shadows.sm,
    },
    itemThumb: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: Theme.colors.border,
    },
    itemMeta: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    itemLabel: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.colors.text.primary,
    },
    catDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 6,
        flexShrink: 0,
    },
    fab: {
        position: 'absolute',
        right: Theme.spacing.md,
        backgroundColor: '#111',
        borderRadius: Theme.radius.full,
        paddingHorizontal: 20,
        paddingVertical: 14,
        ...Theme.shadows.md,
    },
    fabText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: LIME,
    },
    // Adding item states
    scroll: {
        paddingHorizontal: Theme.spacing.md,
    },
    taggingCard: {
        margin: Theme.spacing.md,
        borderRadius: Theme.radius.xxl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.background.surface.light,
        ...Theme.shadows.md,
    },
    taggingImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        opacity: 0.5,
    },
    taggingOverlay: {
        padding: Theme.spacing.xl,
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    taggingTitle: {
        fontSize: 18,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    taggingSubtitle: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
    },
    confirmCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xxl,
        overflow: 'hidden',
        ...Theme.shadows.md,
    },
    confirmImage: {
        width: '100%',
        aspectRatio: 3 / 4,
    },
    confirmInfo: {
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    confirmBadge: {
        alignSelf: 'flex-start',
        backgroundColor: LIME,
        borderRadius: Theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    confirmBadgeText: {
        fontSize: 11,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
        letterSpacing: 0.5,
    },
    confirmLabel: {
        fontSize: 20,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    tagRow: {
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
    chipCategory: {
        backgroundColor: '#111',
    },
    chipOccasion: {
        backgroundColor: '#E8F5E9',
    },
    chipSeason: {
        backgroundColor: '#E3F2FD',
    },
    chipText: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: '#555',
    },
    chipTextDark: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: '#FFF',
    },
    doneBtn: {
        margin: Theme.spacing.md,
        marginTop: 0,
        backgroundColor: LIME,
        borderRadius: Theme.radius.xl,
        paddingVertical: 14,
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    // Gap analysis
    gapCard: {
        marginTop: Theme.spacing.lg,
        backgroundColor: '#FFFBF0',
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        borderWidth: 1,
        borderColor: '#FFE082',
        gap: 6,
    },
    gapTitle: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#5D4037',
    },
    gapSubtitle: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: '#8D6E63',
        marginBottom: 4,
    },
    gapRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 6,
    },
    gapDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 5,
        flexShrink: 0,
    },
    gapItem: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: '#4E342E',
    },
    gapReason: {
        fontSize: 12,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: '#8D6E63',
        lineHeight: 17,
    },
});
