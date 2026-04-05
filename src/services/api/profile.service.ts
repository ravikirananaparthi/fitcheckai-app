import { fitcheckClient } from './fitcheck-client';
import type { UserProfile, ColorAnalysisResult, WeatherOutfitSuggestion } from '@/src/types/profile.types';

// GET /profile/me
export const getProfile = async (): Promise<UserProfile> => {
    const res = await fitcheckClient.get<{ data: UserProfile }>('/profile/me');
    return res.data.data;
};

// PUT /profile/me
export const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'name' | 'city' | 'stylePrefs'>>,
): Promise<UserProfile> => {
    const res = await fitcheckClient.put<{ data: UserProfile }>('/profile/me', updates);
    return res.data.data;
};

// POST /profile/color-analysis — upload portrait for seasonal color type
export const analyzeColorPalette = async (imageUri: string): Promise<ColorAnalysisResult> => {
    const formData = new FormData();
    formData.append('image', {
        uri: imageUri,
        name: 'portrait.jpg',
        type: 'image/jpeg',
    } as any);

    const res = await fitcheckClient.post<{ data: ColorAnalysisResult }>(
        '/profile/color-analysis',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
};

// GET /weather/outfit-suggestion
export const getWeatherSuggestion = async (
    lat?: number,
    lon?: number,
): Promise<WeatherOutfitSuggestion> => {
    const res = await fitcheckClient.get<{ data: WeatherOutfitSuggestion }>(
        '/weather/outfit-suggestion',
        { params: { lat, lon } },
    );
    return res.data.data;
};
