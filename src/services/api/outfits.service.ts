import { fitcheckClient } from './fitcheck-client';
import type { Outfit, OutfitSuggestionsResponse } from '@/src/types/wardrobe.types';

// GET /outfits — list saved outfits
export const getOutfits = async (): Promise<Outfit[]> => {
    const res = await fitcheckClient.get<{ data: Outfit[] }>('/outfits');
    return res.data.data;
};

// POST /outfits — save outfit from selected item IDs
export const createOutfit = async (
    name: string,
    itemIds: string[],
    occasion?: string,
    notes?: string,
): Promise<Outfit> => {
    const res = await fitcheckClient.post<{ data: Outfit }>('/outfits', {
        name,
        itemIds,
        occasion,
        notes,
    });
    return res.data.data;
};

// POST /outfits/suggest — AI suggest outfits from wardrobe for an occasion
export const suggestOutfits = async (
    occasion: string,
    context?: string,
): Promise<OutfitSuggestionsResponse> => {
    const res = await fitcheckClient.post<{ data: OutfitSuggestionsResponse }>('/outfits/suggest', {
        occasion,
        context,
    });
    return res.data.data;
};

// POST /outfits/occasion-planner — same as suggest but via occasion planner endpoint
export const occasionPlanner = async (
    occasion: string,
    context?: string,
): Promise<OutfitSuggestionsResponse> => {
    const res = await fitcheckClient.post<{ data: OutfitSuggestionsResponse }>('/outfits/occasion-planner', {
        occasion,
        context,
    });
    return res.data.data;
};

// DELETE /outfits/:id
export const deleteOutfit = async (id: string): Promise<void> => {
    await fitcheckClient.delete(`/outfits/${id}`);
};
