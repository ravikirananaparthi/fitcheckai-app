export type StylePersona =
    | 'UNCLASSIFIED'
    | 'MINIMALIST'
    | 'MAXIMALIST'
    | 'STREETWEAR'
    | 'CLASSIC'
    | 'BOHO'
    | 'DARK_ACADEMIC'
    | 'PREPPY'
    | 'ATHLEISURE';

export type ColorSeason = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export type UserPlan = 'FREE' | 'PRO';

export interface UserProfile {
    id: string;
    name: string | null;
    avatar: string | null;
    phone: string | null;
    stylePrefs: string[];
    stylePersona: StylePersona;
    colorPalette: ColorSeason | null;
    fitCheckCount: number;
    plan: UserPlan;
    city: string | null;
    createdAt: string;
}

export interface ColorAnalysisResult {
    colorPalette: ColorSeason;
}

export interface WeatherData {
    temperature: number;
    condition: string;
    icon: string;
    city: string;
}

export interface WeatherOutfitSuggestion {
    weather: WeatherData;
    suggestion: {
        name: string;
        reason: string;
        itemIds: string[];
    } | null;
}
