import { Platform } from 'react-native';
import { fitcheckClient } from './fitcheck-client';
import type {
    ClothingItem,
    ClothingCategory,
    OutfitCombosResponse,
    GapAnalysisResponse,
} from '@/src/types/wardrobe.types';

// GET /wardrobe/items — optionally filtered by category
export const getWardrobeItems = async (category?: ClothingCategory): Promise<ClothingItem[]> => {
    const res = await fitcheckClient.get<{ data: ClothingItem[] }>('/wardrobe/items', {
        params: category ? { category } : undefined,
    });
    return res.data.data;
};

// POST /wardrobe/items — upload and tag a piece
export const addWardrobeItem = async (
    imageUri: string, notes?: string, mimeType?: string | null, fileName?: string | null,
): Promise<ClothingItem> => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const file = await response.blob();
        formData.append('image', file, fileName ?? 'item.jpg');
    } else {
        formData.append('image', {
            uri: imageUri,
            name: fileName ?? 'item.jpg',
            type: mimeType ?? 'image/jpeg',
        } as unknown as Blob);
    }
    if (notes) formData.append('notes', notes);

    const res = await fitcheckClient.post<{ data: ClothingItem }>('/wardrobe/items', formData, {
        headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' },
    });
    return res.data.data;
};

// PUT /wardrobe/items/:id — edit tags
export const updateWardrobeItem = async (
    id: string,
    updates: Partial<Pick<ClothingItem, 'label' | 'category' | 'occasions' | 'seasons' | 'tags' | 'isFavorite' | 'notes'>>,
): Promise<ClothingItem> => {
    const res = await fitcheckClient.put<{ data: ClothingItem }>(`/wardrobe/items/${id}`, updates);
    return res.data.data;
};

// DELETE /wardrobe/items/:id — soft archive
export const archiveWardrobeItem = async (id: string): Promise<void> => {
    await fitcheckClient.delete(`/wardrobe/items/${id}`);
};

// GET /wardrobe/items/:id/combos — AI outfit combos for this item
export const getItemCombos = async (id: string): Promise<OutfitCombosResponse> => {
    const res = await fitcheckClient.get<{ data: OutfitCombosResponse }>(`/wardrobe/items/${id}/combos`);
    return res.data.data;
};

// GET /wardrobe/gap-analysis — what's missing from wardrobe
export const getGapAnalysis = async (): Promise<GapAnalysisResponse> => {
    const res = await fitcheckClient.get<{ data: GapAnalysisResponse }>('/wardrobe/gap-analysis');
    return res.data.data;
};
