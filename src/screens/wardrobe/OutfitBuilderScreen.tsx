import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, FlatList, TextInput, ActivityIndicator,
    Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { suggestOutfits, createOutfit } from '@/src/services/api/outfits.service';
import type { ClothingItem, OutfitSuggestion } from '@/src/types/wardrobe.types';

const LIME = Theme.palette.primary;

const OCCASION_PRESETS = ['Office', 'Date night', 'Casual day', 'Party', 'Beach', 'Workout', 'Travel'];

type BuilderState =
    | { step: 'select' }
    | { step: 'occasion'; selectedIds: string[] }
    | { step: 'loading'; occasion: string }
    | { step: 'results'; occasion: string; suggestions: OutfitSuggestion[] };

interface Props {
    items: ClothingItem[];
    onBack: () => void;
}

export function OutfitBuilderScreen({ items, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [builderState, setBuilderState] = useState<BuilderState>({ step: 'select' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [occasion, setOccasion] = useState('');
    const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());
    const [savingIndex, setSavingIndex] = useState<number | null>(null);

    const toggleItem = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const goToOccasion = useCallback(() => {
        if (selectedIds.size < 2) {
            Alert.alert('Select items', 'Pick at least 2 items to build an outfit.');
            return;
        }
        setBuilderState({ step: 'occasion', selectedIds: [...selectedIds] });
    }, [selectedIds]);

    const getSuggestions = useCallback(async (occ: string) => {
        if (!occ.trim()) {
            Alert.alert('Enter occasion', 'Describe what the outfit is for.');
            return;
        }
        setBuilderState({ step: 'loading', occasion: occ });
        try {
            const result = await suggestOutfits(occ);
            setBuilderState({ step: 'results', occasion: occ, suggestions: result.suggestions ?? [] });
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not generate suggestions.');
            setBuilderState({ step: 'occasion', selectedIds: [...selectedIds] });
        }
    }, [selectedIds]);

    const handleSave = useCallback(async (suggestion: OutfitSuggestion, index: number) => {
        try {
            setSavingIndex(index);
            await createOutfit(suggestion.name, suggestion.itemIds, builderState.step === 'results' ? builderState.occasion : undefined);
            setSavedOutfits((prev) => new Set(prev).add(index));
            Alert.alert('Saved!', `"${suggestion.name}" added to your outfits.`);
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not save outfit.');
        } finally {
            setSavingIndex(null);
        }
    }, [builderState]);

    // ─── Results view ─────────────────────────────────────────────────────────

    if (builderState.step === 'results') {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setBuilderState({ step: 'select' })} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Text style={styles.backBtn}>← Start Over</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                >
                    <Animated.View entering={FadeIn} style={styles.heroSection}>
                        <Text style={styles.heroEmoji}>🎯</Text>
                        <Text style={styles.title}>AI Outfit Picks</Text>
                        <Text style={styles.subtitle}>For: {builderState.occasion}</Text>
                    </Animated.View>

                    {builderState.suggestions.length === 0 ? (
                        <Text style={styles.noResultsText}>
                            No suggestions found. Try a different occasion or add more items.
                        </Text>
                    ) : (
                        builderState.suggestions.map((s, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeInDown.delay(i * 100)}
                                style={styles.suggestionCard}
                            >
                                <View style={styles.suggestionHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.suggestionName}>{s.name}</Text>
                                        <Text style={styles.suggestionReason}>{s.reason}</Text>
                                    </View>
                                    <View style={styles.scoreBadge}>
                                        <Text style={styles.scoreText}>{s.score}/10</Text>
                                    </View>
                                </View>

                                {/* Items used */}
                                <View style={styles.usedItems}>
                                    {s.itemIds.map((id) => {
                                        const item = items.find((it) => it.id === id);
                                        if (!item) return null;
                                        return (
                                            <View key={id} style={styles.usedItem}>
                                                <Image
                                                    source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
                                                    style={styles.usedItemThumb}
                                                    resizeMode="cover"
                                                />
                                                <Text style={styles.usedItemLabel} numberOfLines={1}>
                                                    {item.label}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveBtn, savedOutfits.has(i) && styles.saveBtnSaved]}
                                    onPress={() => !savedOutfits.has(i) && handleSave(s, i)}
                                    disabled={savedOutfits.has(i) || savingIndex === i}
                                    activeOpacity={0.85}
                                >
                                    {savingIndex === i ? (
                                        <ActivityIndicator size="small" color="#111" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>
                                            {savedOutfits.has(i) ? '✓ Saved' : 'Save Outfit'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            </View>
        );
    }

    // ─── Loading view ─────────────────────────────────────────────────────────

    if (builderState.step === 'loading') {
        return (
            <View style={[styles.root, styles.loadingCenter, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color={LIME} />
                <Text style={styles.loadingTitle}>Finding your perfect outfits...</Text>
                <Text style={styles.loadingSubtitle}>
                    Claude is checking your wardrobe for {builderState.occasion}
                </Text>
            </View>
        );
    }

    // ─── Occasion input view ──────────────────────────────────────────────────

    if (builderState.step === 'occasion') {
        return (
            <KeyboardAvoidingView
                style={[styles.root, { paddingTop: insets.top }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <StatusBar barStyle="dark-content" />
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setBuilderState({ step: 'select' })} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Text style={styles.backBtn}>← Back</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                >
                    <Animated.View entering={FadeIn}>
                        <Text style={styles.title}>What's the occasion?</Text>
                        <Text style={styles.subtitle}>Tell AI where you're heading and it'll pick the best outfit from your wardrobe.</Text>

                        {/* Preset chips */}
                        <View style={styles.presetRow}>
                            {OCCASION_PRESETS.map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[styles.presetChip, occasion === preset && styles.presetChipActive]}
                                    onPress={() => setOccasion(preset)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.presetChipText, occasion === preset && styles.presetChipTextActive]}>
                                        {preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.occasionInput}
                            placeholder="Or describe your event..."
                            placeholderTextColor={Theme.colors.text.secondary}
                            value={occasion}
                            onChangeText={setOccasion}
                            multiline
                        />

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => getSuggestions(occasion)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Get AI Suggestions ✨</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ─── Item selection view ──────────────────────────────────────────────────

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.selectionCount}>
                    {selectedIds.size} selected
                </Text>
            </View>

            <View style={styles.selectHeader}>
                <Text style={styles.title}>Build an Outfit</Text>
                <Text style={styles.subtitle}>Select items from your wardrobe, then let AI suggest the best combinations.</Text>
            </View>

            <FlatList
                data={items}
                numColumns={3}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.selectGrid, { paddingBottom: insets.bottom + 100 }]}
                columnWrapperStyle={styles.selectGridRow}
                renderItem={({ item }) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                        <TouchableOpacity
                            style={[styles.selectCard, isSelected && styles.selectCardActive]}
                            onPress={() => toggleItem(item.id)}
                            activeOpacity={0.85}
                        >
                            <Image
                                source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
                                style={styles.selectThumb}
                                resizeMode="cover"
                            />
                            {isSelected && (
                                <View style={styles.selectedOverlay}>
                                    <Text style={styles.checkmark}>✓</Text>
                                </View>
                            )}
                            <Text style={styles.selectLabel} numberOfLines={1}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {selectedIds.size >= 2 && (
                <Animated.View entering={FadeIn} style={[styles.floatingBtn, { bottom: insets.bottom + 90 }]}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={goToOccasion}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryBtnText}>
                            Next: Choose Occasion ({selectedIds.size} items)
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
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
    selectionCount: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: LIME,
    },
    selectHeader: {
        paddingHorizontal: Theme.spacing.md,
        paddingBottom: Theme.spacing.sm,
        gap: 4,
    },
    title: {
        fontSize: 22,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        lineHeight: 20,
    },
    selectGrid: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    selectGridRow: {
        gap: Theme.spacing.sm,
    },
    selectCard: {
        flex: 1,
        borderRadius: Theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: Theme.colors.background.surface.light,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectCardActive: {
        borderColor: LIME,
    },
    selectThumb: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: Theme.colors.border,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(170, 238, 53, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        fontSize: 28,
        color: '#FFF',
        fontFamily: 'GoogleSansFlex_700Bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
        textShadowOffset: { width: 0, height: 1 },
    },
    selectLabel: {
        fontSize: 11,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: Theme.colors.text.secondary,
        padding: 6,
        textAlign: 'center',
    },
    floatingBtn: {
        position: 'absolute',
        left: Theme.spacing.md,
        right: Theme.spacing.md,
    },
    primaryBtn: {
        backgroundColor: LIME,
        borderRadius: Theme.radius.xl,
        paddingVertical: 15,
        alignItems: 'center',
        ...Theme.shadows.md,
    },
    primaryBtnText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    // Occasion step
    scroll: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.md,
        paddingTop: Theme.spacing.sm,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: Theme.spacing.sm,
        marginBottom: Theme.spacing.sm,
    },
    presetChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.background.surface.light,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    presetChipActive: {
        borderColor: LIME,
        backgroundColor: '#F5FFE0',
    },
    presetChipText: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: Theme.colors.text.secondary,
    },
    presetChipTextActive: {
        color: Theme.palette.primaryDark,
        fontFamily: 'GoogleSansFlex_700Bold',
    },
    occasionInput: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.primary,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
    },
    // Loading
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
    },
    loadingTitle: {
        fontSize: 18,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    loadingSubtitle: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
    },
    // Results
    heroSection: {
        alignItems: 'center',
        gap: 6,
        paddingVertical: Theme.spacing.md,
    },
    heroEmoji: { fontSize: 40 },
    noResultsText: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        padding: Theme.spacing.xl,
        lineHeight: 22,
    },
    suggestionCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Theme.spacing.sm,
    },
    suggestionName: {
        fontSize: 17,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    suggestionReason: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        lineHeight: 18,
        marginTop: 3,
    },
    scoreBadge: {
        backgroundColor: LIME,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexShrink: 0,
    },
    scoreText: {
        fontSize: 13,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    usedItems: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    usedItem: {
        width: 64,
        alignItems: 'center',
        gap: 4,
    },
    usedItemThumb: {
        width: 64,
        height: 80,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.border,
    },
    usedItemLabel: {
        fontSize: 10,
        fontFamily: 'GoogleSansFlex_500Medium',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
    },
    saveBtn: {
        backgroundColor: LIME,
        borderRadius: Theme.radius.lg,
        paddingVertical: 12,
        alignItems: 'center',
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
