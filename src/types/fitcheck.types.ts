export type AiJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface FitCheckFeedback {
    score: number;
    styleCategory: string;
    summary: string;
    whatWorks: string[];
    improve: string[];
    occasions: {
        casual: boolean;
        work: boolean;
        date: boolean;
        party: boolean;
        beach: boolean;
    };
    accessories: string[];
    colorPalette: string[];
}

export interface FitCheck {
    id: string;
    imageUrl: string;
    jobStatus: AiJobStatus;
    score: number | null;
    feedback: FitCheckFeedback | null;
    createdAt: string;
}

export interface FitCheckJobResponse {
    fitCheckId: string;
    jobId: string | number;
    status: AiJobStatus;
}

export interface ChatMessage {
    id: string;
    fitCheckId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface StyleTip {
    id: string;
    content: string;
    category: string;
    date: string;
}

export interface CursorPaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}
