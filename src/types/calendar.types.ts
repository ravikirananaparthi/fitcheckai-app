import type { Outfit } from './wardrobe.types';

export interface CalendarEntry {
    id: string;
    userId: string;
    outfitId: string;
    scheduledDate: string;
    eventName: string | null;
    outfit: Outfit | null;
    createdAt: string;
}

export interface CalendarWeek {
    items: CalendarEntry[];
    weekStart: string;
}

export interface AiWeekSuggestion {
    day: string;
    outfitName: string;
    reason: string;
}
