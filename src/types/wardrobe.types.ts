export type ClothingCategory =
    | 'TOPS'
    | 'BOTTOMS'
    | 'SHOES'
    | 'ACCESSORIES'
    | 'OUTERWEAR'
    | 'DRESSES'
    | 'ACTIVEWEAR'
    | 'OTHER';

export type ClothingOccasion =
    | 'CASUAL'
    | 'FORMAL'
    | 'WORK'
    | 'PARTY'
    | 'DATE'
    | 'BEACH'
    | 'SPORT'
    | 'SLEEP';

export type ClothingSeason = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'ALL_SEASON';

export interface ClothingItem {
    id: string;
    userId: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    label: string;
    category: ClothingCategory;
    colors: string[];
    pattern: string | null;
    occasions: ClothingOccasion[];
    seasons: ClothingSeason[];
    tags: string[];
    isFavorite: boolean;
    notes: string | null;
    archivedAt: string | null;
    createdAt: string;
}

export interface OutfitCombo {
    name: string;
    occasion: string;
    items: string[]; // item label strings from wardrobe
}

export interface OutfitCombosResponse {
    combos: OutfitCombo[];
}

export interface GapItem {
    item: string;
    reason: string;
}

export interface GapAnalysisResponse {
    gaps: GapItem[];
}

export interface OutfitSuggestion {
    name: string;
    itemIds: string[];
    reason: string;
    score: number;
}

export interface OutfitSuggestionsResponse {
    suggestions: OutfitSuggestion[];
}

export interface OutfitItem {
    clothingItem: ClothingItem;
    sortOrder: number;
}

export interface Outfit {
    id: string;
    userId: string;
    name: string;
    occasion: string | null;
    notes: string | null;
    aiScore: number | null;
    wornDates: string[];
    createdAt: string;
    items: OutfitItem[];
}
