import { Platform } from 'react-native';
import { fitcheckClient } from './fitcheck-client';
import type {
    FitCheck,
    FitCheckJobResponse,
    ChatMessage,
    StyleTip,
    CursorPaginatedResult,
} from '@/src/types/fitcheck.types';

// POST /fitcheck/analyze
// Accepts a URI from expo-image-picker and optional occasion string
export const analyzeFitCheck = async (
    imageUri: string,
    occasion?: string,
    mimeType?: string | null,
    fileName?: string | null,
): Promise<FitCheckJobResponse> => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, fileName || 'outfit.jpg');
    } else {
        formData.append('image', {
            uri: imageUri,
            name: fileName || 'outfit.jpg',
            type: mimeType || 'image/jpeg',
        } as any);
    }

    if (occasion) formData.append('occasion', occasion);

    const res = await fitcheckClient.post<{ data: FitCheckJobResponse }>(
        '/fitcheck/analyze',
        formData,
        { headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' } },
    );
    return res.data.data;
};

// GET /fitcheck/:id/status — poll until COMPLETED or FAILED
export const getFitCheckStatus = async (id: string): Promise<FitCheck> => {
    const res = await fitcheckClient.get<{ data: FitCheck }>(`/fitcheck/${id}/status`);
    return res.data.data;
};

// GET /fitcheck/:id — full result with chat history
export const getFitCheck = async (id: string): Promise<FitCheck & { chatMessages: ChatMessage[] }> => {
    const res = await fitcheckClient.get<{ data: FitCheck & { chatMessages: ChatMessage[] } }>(`/fitcheck/${id}`);
    return res.data.data;
};

// GET /fitcheck/history — cursor paginated
export const getFitCheckHistory = async (
    cursor?: string,
    limit = 20,
): Promise<CursorPaginatedResult<FitCheck>> => {
    const res = await fitcheckClient.get<{ data: CursorPaginatedResult<FitCheck> }>(
        '/fitcheck/history',
        { params: { cursor, limit } },
    );
    return res.data.data;
};

// POST /fitcheck/:id/chat — send chat message, get AI reply
export const sendChatMessage = async (
    fitCheckId: string,
    message: string,
): Promise<ChatMessage> => {
    const res = await fitcheckClient.post<{ data: ChatMessage }>(
        `/fitcheck/${fitCheckId}/chat`,
        { message },
    );
    return res.data.data;
};

// GET /style-tips/daily — daily AI style tip (no auth required)
export const getDailyStyleTip = async (): Promise<StyleTip> => {
    const res = await fitcheckClient.get<{ data: StyleTip }>('/style-tips/daily');
    return res.data.data;
};
