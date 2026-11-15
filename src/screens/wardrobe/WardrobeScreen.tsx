import { FontFamily, Theme } from '@/constants/theme';
import { addWardrobeItem, archiveWardrobeItem, getGapAnalysis, getWardrobeItems } from '@/src/services/api/wardrobe.service';
import type { ClothingCategory, ClothingItem, OutfitCombo } from '@/src/types/wardrobe.types';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Camera, ChevronRight, ImagePlus, Layers, Plus, Shirt, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemDetailScreen } from './ItemDetailScreen';
import { OutfitBuilderScreen } from './OutfitBuilderScreen';
import { OutfitCombosScreen } from './OutfitCombosScreen';
import { SavedOutfitsScreen } from './SavedOutfitsScreen';
import { fitCheckColors as colors } from '@/constants/fitcheck-colors';

const categories: Record<ClothingCategory, string> = {
    TOPS: 'Tops', BOTTOMS: 'Bottoms', SHOES: 'Shoes', DRESSES: 'Dresses',
    OUTERWEAR: 'Outerwear', ACCESSORIES: 'Accessories', ACTIVEWEAR: 'Activewear', OTHER: 'Other',
};
const itemsKey = ['wardrobe', 'items'];
const gapsKey = ['wardrobe', 'gaps'];

type Screen =
    | { view: 'grid' }
    | { view: 'adding'; uri: string }
    | { view: 'detail'; item: ClothingItem }
    | { view: 'combos'; item: ClothingItem; combos: OutfitCombo[] }
    | { view: 'builder' }
    | { view: 'outfits' };

export default function WardrobeScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const cache = useQueryClient();
    const { itemId } = useLocalSearchParams<{ itemId?: string }>();
    const [screen, setScreen] = useState<Screen>({ view: 'grid' });
    const [category, setCategory] = useState<ClothingCategory | null>(null);
    const [showSources, setShowSources] = useState(false);
    const [notice, setNotice] = useState('');
    const picking = useRef(false);
    const openedLink = useRef<string | undefined>(undefined);
    const wardrobe = useQuery({ queryKey: itemsKey, queryFn: () => getWardrobeItems() });
    const items = wardrobe.data ?? [];
    const gaps = useQuery({ queryKey: gapsKey, queryFn: getGapAnalysis, enabled: items.length >= 5 });
    const filtered = category ? items.filter((item) => item.category === category) : items;
    const availableWidth = Platform.OS === 'web' && width >= 760 ? width - 240 : width;
    const columns = availableWidth >= 1000 ? 4 : availableWidth >= 640 ? 3 : 2;
    const bottom = Platform.OS === 'ios' ? insets.bottom + 72 : 24;

    useEffect(() => {
        if (!itemId) {
            openedLink.current = undefined;
            return;
        }
        if (!wardrobe.data || openedLink.current === itemId) return;
        openedLink.current = itemId;
        const item = wardrobe.data.find((piece) => piece.id === itemId);
        if (item) setScreen({ view: 'detail', item });
        else setNotice('That piece is no longer in your wardrobe.');
    }, [itemId, wardrobe.data]);

    function backToGrid() {
        setScreen({ view: 'grid' });
    }

    async function pickAndAdd(source: 'camera' | 'gallery') {
        if (picking.current) return;
        picking.current = true;
        setNotice('');
        setShowSources(false);
        try {
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    setNotice('Camera access is off. You can choose a photo from your library.');
                    return;
                }
            }
            const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
            const result = await (source === 'camera'
                ? ImagePicker.launchCameraAsync(options)
                : ImagePicker.launchImageLibraryAsync(options));
            if (result.canceled) return;
            const photo = result.assets[0];
            setScreen({ view: 'adding', uri: photo.uri });
            const item = await addWardrobeItem(photo.uri, undefined, photo.mimeType, photo.fileName);
            cache.setQueryData<ClothingItem[]>(itemsKey, (previous) => [item, ...(previous ?? []).filter((piece) => piece.id !== item.id)]);
            void cache.invalidateQueries({ queryKey: itemsKey });
            void cache.invalidateQueries({ queryKey: gapsKey });
            setCategory(null);
            setNotice('Item added to your wardrobe.');
            setScreen({ view: 'detail', item });
        } catch (error) {
            setNotice(error instanceof Error ? error.message : 'Couldn’t add this item. Try again.');
            backToGrid();
        } finally {
            picking.current = false;
        }
    }

    function addItem() {
        if (Platform.OS === 'web') void pickAndAdd('gallery');
        else setShowSources((open) => !open);
    }

    function onArchive(item: ClothingItem) {
        const archive = async () => {
            try {
                await archiveWardrobeItem(item.id);
                cache.setQueryData<ClothingItem[]>(itemsKey, (previous) => previous?.filter((piece) => piece.id !== item.id));
                void cache.invalidateQueries({ queryKey: itemsKey });
                void cache.invalidateQueries({ queryKey: gapsKey });
                setNotice('Item archived.');
                backToGrid();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Couldn’t archive this item.';
                if (Platform.OS === 'web') window.alert(message);
                else Alert.alert('Couldn’t archive item', message);
            }
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Archive “${item.label}”?`)) void archive();
            return;
        }
        Alert.alert('Archive item?', `“${item.label}” will be removed from your wardrobe.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Archive', style: 'destructive', onPress: () => void archive() },
        ]);
    }

    if (screen.view === 'detail') return (
        <ItemDetailScreen item={screen.item} onBack={backToGrid} onArchive={onArchive}
            onGetCombos={(item, combos) => setScreen({ view: 'combos', item, combos })} />
    );
    if (screen.view === 'combos') return (
        <OutfitCombosScreen item={screen.item} combos={screen.combos} allItems={items}
            onBack={() => setScreen({ view: 'detail', item: screen.item })} />
    );
    if (screen.view === 'builder') return <OutfitBuilderScreen items={items} onBack={backToGrid} />;
    if (screen.view === 'outfits') return <SavedOutfitsScreen allItems={items} onBack={backToGrid} />;
    if (screen.view === 'adding') return (
        <View style={[styles.root, styles.progress, { paddingTop: insets.top }]}>
            <Image source={screen.uri} style={styles.preview} contentFit="cover" accessibilityLabel="Selected wardrobe photo" />
            <ActivityIndicator color={colors.purple} />
            <Text accessibilityLiveRegion="polite" style={styles.sectionTitle}>Adding your item…</Text>
            <Text style={styles.body}>FitCheck is identifying the piece and its colors.</Text>
        </View>
    );

    const heading = (
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <View style={styles.copy}>
                    <Text accessibilityRole="header" style={styles.title}>Wardrobe</Text>
                    <Text style={styles.body}>{wardrobe.data ? `${items.length} ${items.length === 1 ? 'piece' : 'pieces'}` : 'Your saved clothes'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityState={Platform.OS === 'web' ? undefined : { expanded: showSources }} onPress={addItem}
                    style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
                    <Plus size={19} color="#fff" /><Text style={styles.primaryText}>Add item</Text>
                </Pressable>
            </View>
            {showSources && (
                <View style={styles.actions}>
                    <Pressable accessibilityRole="button" style={styles.button} onPress={() => void pickAndAdd('camera')}>
                        <Camera size={18} color={colors.purple} /><Text style={styles.label}>Take a photo</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" style={styles.button} onPress={() => void pickAndAdd('gallery')}>
                        <ImagePlus size={18} color={colors.purple} /><Text style={styles.label}>Choose from library</Text>
                    </Pressable>
                </View>
            )}
            {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
            <View style={styles.tools}>
                <Pressable accessibilityRole="button" onPress={() => setScreen({ view: 'outfits' })}
                    style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
                    <View style={styles.icon}><Layers size={20} color={colors.purple} /></View>
                    <Text style={[styles.label, styles.copy]}>Saved outfits</Text>
                    <ChevronRight size={17} color={colors.secondary} />
                </Pressable>
                <Pressable accessibilityRole="button" disabled={items.length < 2} onPress={() => setScreen({ view: 'builder' })}
                    style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
                    <View style={styles.icon}><Sparkles size={20} color={colors.purple} /></View>
                    <View style={styles.copy}>
                        <Text style={styles.label}>Build an outfit</Text>
                        {items.length < 2 && <Text style={styles.meta}>Needs 2 pieces</Text>}
                    </View>
                    {items.length >= 2 && <ChevronRight size={17} color={colors.secondary} />}
                </Pressable>
            </View>
            {!!items.length && (
                <View style={styles.filters}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>Your pieces</Text>
                    <View style={styles.actions}>
                        {[null, ...(Object.keys(categories) as ClothingCategory[])].map((value) => (
                            <Pressable key={value ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: category === value }}
                                onPress={() => setCategory(value)} style={[styles.filter, category === value && styles.selected]}>
                                <Text style={styles.label}>{value ? categories[value] : 'All'}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.page}>
                <FlashList
                    key={columns}
                    data={filtered}
                    numColumns={columns}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: bottom }}
                    onRefresh={() => void wardrobe.refetch()}
                    refreshing={wardrobe.isRefetching}
                    ListHeaderComponent={heading}
                    ListEmptyComponent={
                        wardrobe.isPending ? <ActivityIndicator color={colors.purple} style={styles.loader} /> : (
                            <View style={styles.empty}>
                                <View style={styles.emptyIcon}><Shirt size={26} color={colors.purple} /></View>
                                <Text accessibilityRole="header" style={styles.sectionTitle}>
                                    {wardrobe.isError ? 'Couldn’t load your wardrobe' : category ? `No ${categories[category].toLowerCase()} yet` : 'Add your first piece'}
                                </Text>
                                <Text style={styles.body}>
                                    {wardrobe.isError ? 'Try loading your saved pieces again.' : category ? 'Choose another category to see more pieces.' : 'Start with something you wear often. FitCheck can use your saved pieces to suggest outfits.'}
                                </Text>
                                <Pressable accessibilityRole="button" onPress={wardrobe.isError ? () => void wardrobe.refetch() : category ? () => setCategory(null) : addItem}
                                    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                                    {!category && !wardrobe.isError && <ImagePlus size={18} color={colors.purple} />}
                                    <Text style={styles.label}>{wardrobe.isError ? 'Try again' : category ? 'Show all pieces' : 'Add a photo'}</Text>
                                </Pressable>
                            </View>
                        )
                    }
                    renderItem={({ item }) => (
                        <View style={styles.cell}>
                            <Pressable accessibilityRole="button" accessibilityLabel={`${item.label}, ${categories[item.category] ?? 'Other'}`}
                                onPress={() => setScreen({ view: 'detail', item })}
                                style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                                <View style={styles.thumbnail}>
                                    <Shirt size={29} color={colors.purple} />
                                    <Image source={item.thumbnailUrl ?? item.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} recyclingKey={item.id} />
                                </View>
                                <View style={styles.itemCopy}>
                                    <Text style={styles.itemLabel} numberOfLines={2}>{item.label}</Text>
                                    <Text style={styles.meta}>{categories[item.category] ?? 'Other'}</Text>
                                </View>
                            </Pressable>
                        </View>
                    )}
                    ListFooterComponent={!category && !!gaps.data?.gaps.length ? (
                        <View style={styles.gaps}>
                            <Text accessibilityRole="header" style={styles.sectionTitle}>Pieces to consider</Text>
                            {gaps.data.gaps.map((gap, index) => (
                                <View key={`${gap.item}-${index}`}>
                                    <Text style={styles.itemLabel}>{gap.item}</Text>
                                    <Text style={styles.body}>{gap.reason}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Theme.colors.background.light },
    page: { flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 14 },
    header: { paddingHorizontal: 6, paddingTop: Platform.OS === 'web' ? 34 : 16, gap: 18, paddingBottom: 14 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontFamily: FontFamily.bold, fontSize: 34, letterSpacing: -1, color: colors.ink },
    copy: { flex: 1 },
    body: { fontFamily: FontFamily.regular, fontSize: 15, color: colors.secondary, maxWidth: 375 },
    label: { fontFamily: FontFamily.semibold, fontSize: 14, color: colors.purple, flexShrink: 1 },
    meta: { fontFamily: FontFamily.regular, fontSize: 13, color: colors.secondary },
    button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    primary: { backgroundColor: colors.ink, borderColor: colors.ink, flexShrink: 1 },
    primaryText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#fff', flexShrink: 1 },
    pressed: { opacity: 0.73 },
    tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tool: { flexGrow: 1, flexBasis: 144, minHeight: 64, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10 },
    icon: { width: 36, height: 36, borderRadius: 11, borderCurve: 'continuous', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.tint },
    filters: { gap: 9 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    filter: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface },
    selected: { backgroundColor: colors.tint, borderColor: colors.purple },
    sectionTitle: { fontFamily: FontFamily.bold, fontSize: 22, letterSpacing: -0.4, color: colors.ink },
    empty: { marginHorizontal: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 23, borderCurve: 'continuous', padding: 24, gap: 11, alignItems: 'flex-start' },
    emptyIcon: { width: 52, height: 52, borderRadius: 16, borderCurve: 'continuous', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.tint },
    loader: { marginTop: 32 },
    cell: { flex: 1, paddingHorizontal: 6, paddingBottom: 12 },
    item: { borderRadius: 17, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    thumbnail: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
    itemCopy: { padding: 11, gap: 3 },
    itemLabel: { fontFamily: FontFamily.bold, fontSize: 15, color: colors.ink },
    gaps: { gap: 12, margin: 6, padding: 17, backgroundColor: colors.tint, borderRadius: 18, borderCurve: 'continuous' },
    notice: { fontFamily: FontFamily.semibold, fontSize: 14, color: colors.ink, backgroundColor: colors.tint, padding: 12, borderRadius: 12 },
    progress: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
    preview: { width: 150, height: 180, borderRadius: 16, backgroundColor: colors.tint },
});
