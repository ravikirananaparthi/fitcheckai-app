import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import { fitcheckClient } from './fitcheck-client';
import type { FitCheck } from '@/src/types/fitcheck.types';

export type WeatherChoice = { city: string } | { latitude: number; longitude: number };

export interface StylistSummary {
    id: string;
    title: string;
    updatedAt: string;
    fitCheckId: string | null;
}

export interface StylistPiece {
    id: string;
    label: string;
    imageUrl: string;
}

export interface StylistConversation {
    id: string;
    title: string;
    fitCheck: Pick<FitCheck, 'id' | 'imageUrl' | 'score' | 'feedback'> | null;
    legacyMessages: { id: string; role: string; content: string }[];
    turns: {
        id: string;
        question: string;
        imageUrl: string | null;
        answer: string;
        weatherLabel: string | null;
        wardrobe: StylistPiece[];
    }[];
}

export interface StylistDraft {
    requestId: string;
    question: string;
    photo: ImagePickerAsset | null;
    weather: WeatherChoice | null;
}

const path = '/stylist/conversations';

export async function listConversations() {
    return (await fitcheckClient.get<{ data: StylistSummary[] }>(path)).data.data;
}

export async function openConversation(fitCheckId?: string) {
    return (await fitcheckClient.post<{ data: { id: string } }>(path, { fitCheckId })).data.data;
}

export async function getConversation(id: string) {
    return (await fitcheckClient.get<{ data: StylistConversation }>(`${path}/${id}`)).data.data;
}

export async function sendStylistTurn(id: string, draft: StylistDraft) {
    const body = new FormData();
    body.append('requestId', draft.requestId);
    body.append('question', draft.question);
    if (draft.weather && 'city' in draft.weather) {
        body.append('city', draft.weather.city);
    } else if (draft.weather) {
        body.append('latitude', String(draft.weather.latitude));
        body.append('longitude', String(draft.weather.longitude));
    }
    if (draft.photo) {
        const { uri, file, fileName, mimeType } = draft.photo;
        if (Platform.OS === 'web') {
            body.append('image', file ?? await (await fetch(uri)).blob(), fileName ?? 'outfit.jpg');
        } else {
            body.append('image', { uri, name: fileName ?? 'outfit.jpg', type: mimeType ?? 'image/jpeg' } as unknown as Blob);
        }
    }
    const result = await fitcheckClient.post<{ data: StylistConversation }>(`${path}/${id}/turns`, body, {
        headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' },
        timeout: 90000,
    });
    return result.data.data;
}
