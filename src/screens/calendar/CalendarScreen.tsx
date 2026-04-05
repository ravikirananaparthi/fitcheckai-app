import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import {
    getCalendarWeek,
    removeCalendarEntry,
    markWorn,
    aiSuggestWeek,
} from '@/src/services/api/calendar.service';
import type { CalendarEntry } from '@/src/types/calendar.types';

const LIME = Theme.palette.primary;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

interface Props {
    onBack: () => void;
}

export function CalendarScreen({ onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);

    const weekDates = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]);

    const loadWeek = useCallback(async (start: Date = weekStart) => {
        try {
            setLoading(true);
            const data = await getCalendarWeek(formatDate(start));
            setEntries(data ?? []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [weekStart]);

    useEffect(() => { loadWeek(); }, [weekStart]);

    const goToPrevWeek = () => setWeekStart(addDays(weekStart, -7));
    const goToNextWeek = () => setWeekStart(addDays(weekStart, 7));
    const goToThisWeek = () => setWeekStart(getMonday(new Date()));

    const isThisWeek = formatDate(getMonday(new Date())) === formatDate(weekStart);
    const today = formatDate(new Date());

    const handleRemove = useCallback(async (entry: CalendarEntry) => {
        Alert.alert('Remove from calendar?', '', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await removeCalendarEntry(entry.id);
                        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                    } catch (err: any) {
                        Alert.alert('Error', err?.message ?? 'Could not remove entry.');
                    }
                },
            },
        ]);
    }, []);

    const handleMarkWorn = useCallback(async (entry: CalendarEntry) => {
        try {
            await markWorn(entry.id);
            Alert.alert('Marked as worn!');
            loadWeek();
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not mark as worn.');
        }
    }, [loadWeek]);

    const handleAiFill = useCallback(async () => {
        setAiLoading(true);
        try {
            const data = await aiSuggestWeek(formatDate(weekStart));
            setEntries(data ?? []);
            Alert.alert('AI filled your week!', 'Review the suggestions and adjust as needed.');
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not generate AI suggestions.');
        } finally {
            setAiLoading(false);
        }
    }, [weekStart]);

    // Check if outfit was worn in last 7 days (repeat warning)
    const isRecentlyWorn = useCallback((entry: CalendarEntry): boolean => {
        if (!entry.outfit?.wornDates?.length) return false;
        const sevenDaysAgo = addDays(new Date(), -7).getTime();
        return entry.outfit.wornDates.some((d) => new Date(d).getTime() > sevenDaysAgo);
    }, []);

    const weekLabel = useMemo(() => {
        const end = addDays(weekStart, 6);
        const startMonth = weekStart.toLocaleDateString('en', { month: 'short' });
        const endMonth = end.toLocaleDateString('en', { month: 'short' });
        const startDay = weekStart.getDate();
        const endDay = end.getDate();
        if (startMonth === endMonth) {
            return `${startMonth} ${startDay} – ${endDay}`;
        }
        return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
    }, [weekStart]);

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.backBtn}>← Profile</Text>
                </TouchableOpacity>
                {!isThisWeek && (
                    <TouchableOpacity onPress={goToThisWeek} activeOpacity={0.8}>
                        <Text style={styles.todayBtn}>Today</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Week nav */}
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={goToPrevWeek} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.weekLabel}>{weekLabel}</Text>
                <TouchableOpacity onPress={goToNextWeek} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaders}>
                {weekDates.map((date, i) => {
                    const dateStr = formatDate(date);
                    const isToday = dateStr === today;
                    return (
                        <View key={i} style={styles.dayHeader}>
                            <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{DAYS[i]}</Text>
                            <View style={[styles.dayNumCircle, isToday && styles.dayNumCircleToday]}>
                                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{date.getDate()}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Calendar body */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={LIME} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
                >
                    {/* Day columns */}
                    {weekDates.map((date, i) => {
                        const dateStr = formatDate(date);
                        const isToday = dateStr === today;
                        const dayEntries = entries.filter(
                            (e) => e.scheduledDate?.split('T')[0] === dateStr,
                        );

                        return (
                            <Animated.View
                                key={dateStr}
                                entering={FadeInDown.delay(i * 40)}
                                style={[styles.dayRow, isToday && styles.dayRowToday]}
                            >
                                <View style={styles.dayLabel}>
                                    <Text style={[styles.dayRowName, isToday && styles.dayRowNameToday]}>
                                        {DAYS[i]}
                                    </Text>
                                    <Text style={[styles.dayRowDate, isToday && styles.dayRowDateToday]}>
                                        {date.getDate()}
                                    </Text>
                                </View>

                                <View style={styles.dayContent}>
                                    {dayEntries.length === 0 ? (
                                        <Text style={styles.emptyDay}>No outfit planned</Text>
                                    ) : (
                                        dayEntries.map((entry) => {
                                            const repeated = isRecentlyWorn(entry);
                                            const firstItem = entry.outfit?.items?.[0]?.clothingItem;
                                            return (
                                                <TouchableOpacity
                                                    key={entry.id}
                                                    style={[styles.outfitTile, repeated && styles.outfitTileRepeated]}
                                                    onLongPress={() => handleRemove(entry)}
                                                    onPress={() => handleMarkWorn(entry)}
                                                    activeOpacity={0.85}
                                                >
                                                    {firstItem?.thumbnailUrl && (
                                                        <Image
                                                            source={{ uri: firstItem.thumbnailUrl }}
                                                            style={styles.outfitThumb}
                                                            resizeMode="cover"
                                                        />
                                                    )}
                                                    <View style={styles.outfitInfo}>
                                                        <Text style={styles.outfitName} numberOfLines={1}>
                                                            {entry.outfit?.name ?? 'Outfit'}
                                                        </Text>
                                                        {entry.eventName && (
                                                            <Text style={styles.eventName} numberOfLines={1}>
                                                                {entry.eventName}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {repeated && (
                                                        <View style={styles.repeatBadge}>
                                                            <Text style={styles.repeatText}>Repeat</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </View>
                            </Animated.View>
                        );
                    })}

                    {/* Hint */}
                    <Text style={styles.hint}>Tap outfit to mark worn. Long press to remove.</Text>
                </ScrollView>
            )}

            {/* AI Fill Week FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 90 }]}
                onPress={handleAiFill}
                disabled={aiLoading}
                activeOpacity={0.9}
            >
                {aiLoading ? (
                    <ActivityIndicator size="small" color="#111" />
                ) : (
                    <Text style={styles.fabText}>✨ AI Fill Week</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Theme.colors.background.light },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm,
    },
    backBtn: { fontSize: 16, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.palette.primaryDark },
    todayBtn: { fontSize: 14, fontFamily: 'GoogleSansFlex_600SemiBold', color: LIME },

    // Week nav
    weekNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: Theme.spacing.lg, paddingVertical: Theme.spacing.xs,
    },
    navArrow: { fontSize: 28, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.secondary, lineHeight: 32 },
    weekLabel: { fontSize: 17, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary, minWidth: 160, textAlign: 'center' },

    // Day headers
    dayHeaders: {
        flexDirection: 'row', paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm, gap: 4,
    },
    dayHeader: { flex: 1, alignItems: 'center', gap: 4 },
    dayName: { fontSize: 11, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.colors.text.secondary, textTransform: 'uppercase' },
    dayNameToday: { color: Theme.palette.primaryDark },
    dayNumCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dayNumCircleToday: { backgroundColor: LIME },
    dayNum: { fontSize: 13, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    dayNumToday: { color: '#111' },

    // Scroll body
    scroll: { paddingHorizontal: Theme.spacing.md, gap: 6 },

    // Day rows
    dayRow: {
        flexDirection: 'row', minHeight: 72,
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.lg, padding: 10, gap: 12,
        borderLeftWidth: 3, borderLeftColor: 'transparent',
    },
    dayRowToday: { borderLeftColor: LIME, backgroundColor: '#FCFFF5' },
    dayLabel: { width: 36, alignItems: 'center', gap: 2, paddingTop: 2 },
    dayRowName: { fontSize: 10, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.colors.text.secondary, textTransform: 'uppercase' },
    dayRowNameToday: { color: Theme.palette.primaryDark },
    dayRowDate: { fontSize: 16, fontFamily: 'GoogleSansFlex_700Bold', color: Theme.colors.text.primary },
    dayRowDateToday: { color: Theme.palette.primaryDark },
    dayContent: { flex: 1, gap: 6, justifyContent: 'center' },
    emptyDay: { fontSize: 13, fontFamily: 'GoogleSansFlex_400Regular', color: '#C0C0C0', fontStyle: 'italic' },

    // Outfit tile
    outfitTile: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8F8F8', borderRadius: Theme.radius.lg,
        padding: 8, borderWidth: 1.5, borderColor: 'transparent',
    },
    outfitTileRepeated: { borderColor: '#FF9800' },
    outfitThumb: { width: 40, height: 50, borderRadius: Theme.radius.sm, backgroundColor: Theme.colors.border },
    outfitInfo: { flex: 1, gap: 2 },
    outfitName: { fontSize: 13, fontFamily: 'GoogleSansFlex_600SemiBold', color: Theme.colors.text.primary },
    eventName: { fontSize: 11, fontFamily: 'GoogleSansFlex_400Regular', color: Theme.colors.text.secondary },
    repeatBadge: { backgroundColor: '#FFF3E0', borderRadius: Theme.radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    repeatText: { fontSize: 10, fontFamily: 'GoogleSansFlex_700Bold', color: '#E65100' },

    hint: {
        fontSize: 12, fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary, textAlign: 'center', marginTop: Theme.spacing.sm,
    },

    // FAB
    fab: {
        position: 'absolute', left: Theme.spacing.md, right: Theme.spacing.md,
        backgroundColor: LIME, borderRadius: Theme.radius.xl,
        paddingVertical: 15, alignItems: 'center',
        ...Theme.shadows.md,
    },
    fabText: { fontSize: 15, fontFamily: 'GoogleSansFlex_700Bold', color: '#111' },
});
