import { fitcheckClient } from './fitcheck-client';
import type { CalendarEntry } from '@/src/types/calendar.types';

// GET /calendar/week?startDate=2026-04-06
export const getCalendarWeek = async (startDate: string): Promise<CalendarEntry[]> => {
    const res = await fitcheckClient.get<{ data: CalendarEntry[] }>('/calendar/week', {
        params: { startDate },
    });
    return res.data.data;
};

// POST /calendar — schedule an outfit
export const scheduleOutfit = async (
    outfitId: string,
    scheduledDate: string,
    eventName?: string,
): Promise<CalendarEntry> => {
    const res = await fitcheckClient.post<{ data: CalendarEntry }>('/calendar', {
        outfitId,
        scheduledDate,
        eventName,
    });
    return res.data.data;
};

// PATCH /calendar/:id/worn — mark as worn
export const markWorn = async (id: string): Promise<CalendarEntry> => {
    const res = await fitcheckClient.patch<{ data: CalendarEntry }>(`/calendar/${id}/worn`);
    return res.data.data;
};

// DELETE /calendar/:id
export const removeCalendarEntry = async (id: string): Promise<void> => {
    await fitcheckClient.delete(`/calendar/${id}`);
};

// POST /calendar/ai-suggest — AI fills the week
export const aiSuggestWeek = async (
    weekStartDate: string,
    notes?: string,
): Promise<CalendarEntry[]> => {
    const res = await fitcheckClient.post<{ data: CalendarEntry[] }>('/calendar/ai-suggest', {
        weekStartDate,
        notes,
    });
    return res.data.data;
};
