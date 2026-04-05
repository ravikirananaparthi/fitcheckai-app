import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, FlatList, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useMotionify } from 'react-native-motionify';
import { Theme } from '@/constants/theme';
import {
    analyzeFitCheck,
    getFitCheckStatus,
    getFitCheckHistory,
    getFitCheck,
} from '@/src/services/api/fitcheck.service';
import { FitCheckResultScreen } from './FitCheckResultScreen';
import { FitCheckChatScreen } from './FitCheckChatScreen';
import type { FitCheck, ChatMessage } from '@/src/types/fitcheck.types';

type ScreenState =
    | { view: 'idle' }
    | { view: 'analyzing'; fitCheckId: string }
    | { view: 'result'; fitCheck: FitCheck }
    | { view: 'chat'; fitCheck: FitCheck; chatMessages: ChatMessage[] };

export default function AIStylistScreen() {
    const insets = useSafeAreaInsets();
    const { onScroll } = useMotionify();
    const [state, setState] = useState<ScreenState>({ view: 'idle' });
    const [history, setHistory] = useState<FitCheck[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await getFitCheckHistory();
            setHistory(res.items.filter((c) => c.jobStatus === 'COMPLETED'));
        } catch {
            // Silently fail — history is non-critical
        } finally {
            setHistoryLoading(false);
        }
    };

    const pickAndAnalyze = useCallback(async (source: 'camera' | 'gallery') => {
        const permission =
            source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission needed',
                `Please allow ${source} access in Settings to use this feature.`,
            );
            return;
        }

        const result =
            source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                      allowsEditing: true,
                      aspect: [3, 4],
                  })
                : await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                      allowsEditing: true,
                      aspect: [3, 4],
                  });

        if (result.canceled || !result.assets[0]) return;

        const imageUri = result.assets[0].uri;

        try {
            const job = await analyzeFitCheck(imageUri);
            setState({ view: 'analyzing', fitCheckId: job.fitCheckId });
            pollForResult(job.fitCheckId);
        } catch (err: any) {
            Alert.alert('Upload failed', err?.message ?? 'Please try again.');
        }
    }, []);

    const pollForResult = useCallback(async (fitCheckId: string) => {
        const maxAttempts = 30; // 30 × 2s = 60s timeout
        let attempts = 0;

        const poll = async () => {
            attempts++;
            try {
                const check = await getFitCheckStatus(fitCheckId);

                if (check.jobStatus === 'COMPLETED') {
                    setState({ view: 'result', fitCheck: check });
                    loadHistory(); // Refresh history
                    return;
                }

                if (check.jobStatus === 'FAILED' || attempts >= maxAttempts) {
                    Alert.alert('Analysis failed', 'AI could not analyze your outfit. Please try again.');
                    setState({ view: 'idle' });
                    return;
                }

                setTimeout(poll, 2000);
            } catch {
                setTimeout(poll, 3000);
            }
        };

        poll();
    }, []);

    const openChat = useCallback(async () => {
        if (state.view !== 'result') return;
        try {
            const full = await getFitCheck(state.fitCheck.id);
            setState({ view: 'chat', fitCheck: full, chatMessages: full.chatMessages });
        } catch {
            setState({ view: 'chat', fitCheck: state.fitCheck, chatMessages: [] });
        }
    }, [state]);

    // Sub-screen renders
    if (state.view === 'result') {
        return (
            <FitCheckResultScreen
                fitCheck={state.fitCheck}
                onChatPress={openChat}
                onNewCheck={() => setState({ view: 'idle' })}
            />
        );
    }

    if (state.view === 'chat') {
        return (
            <FitCheckChatScreen
                fitCheckId={state.fitCheck.id}
                initialMessages={state.chatMessages}
                onBack={() => setState({ view: 'result', fitCheck: state.fitCheck })}
            />
        );
    }

    // Idle + Analyzing states share the same layout
    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AI Stylist</Text>
                <Text style={styles.headerSub}>Does this look good? Ask AI.</Text>
            </View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
            >
                {/* Upload card */}
                {state.view === 'idle' ? (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.uploadCard}>
                        <Text style={styles.uploadEmoji}>👗</Text>
                        <Text style={styles.uploadTitle}>Check Your Fit</Text>
                        <Text style={styles.uploadSubtitle}>
                            Get an AI score, style tips, and chat with your personal stylist.
                        </Text>
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => pickAndAnalyze('camera')}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => pickAndAnalyze('gallery')}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.secondaryBtnText}>🖼  Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : (
                    /* Analyzing state */
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.analyzingCard}>
                        <ActivityIndicator size="large" color={Theme.palette.primary} />
                        <Text style={styles.analyzingTitle}>Analyzing your fit...</Text>
                        <Text style={styles.analyzingSubtitle}>
                            Gemini AI is checking your color coordination, fit, and occasion suitability.
                        </Text>
                    </Animated.View>
                )}

                {/* History */}
                {history.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.sectionLabel}>Recent Checks</Text>
                        <FlatList
                            data={history}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.historyList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.historyCard}
                                    onPress={() => setState({ view: 'result', fitCheck: item })}
                                    activeOpacity={0.85}
                                >
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.historyThumb}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.historyMeta}>
                                        <Text style={styles.historyScore}>
                                            {item.score?.toFixed(1) ?? '—'}/10
                                        </Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(item.createdAt).toLocaleDateString('en', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {historyLoading && history.length === 0 && (
                    <View style={styles.loadingHistory}>
                        <ActivityIndicator size="small" color={Theme.colors.text.secondary} />
                    </View>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.sm,
        paddingBottom: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    headerSub: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        marginTop: 2,
    },
    scroll: {
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.lg,
    },
    uploadCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xxl,
        padding: Theme.spacing.xl,
        alignItems: 'center',
        gap: Theme.spacing.md,
        ...Theme.shadows.md,
    },
    uploadEmoji: {
        fontSize: 48,
    },
    uploadTitle: {
        fontSize: 22,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    uploadSubtitle: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    btnRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
        width: '100%',
        marginTop: Theme.spacing.sm,
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: Theme.palette.primary,
        borderRadius: Theme.radius.xl,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryBtnText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111111',
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: Theme.radius.xl,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Theme.palette.primary,
    },
    secondaryBtnText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_600SemiBold',
        color: Theme.palette.primaryDark,
    },
    analyzingCard: {
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xxl,
        padding: Theme.spacing.xl,
        alignItems: 'center',
        gap: Theme.spacing.md,
        ...Theme.shadows.md,
    },
    analyzingTitle: {
        fontSize: 20,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    analyzingSubtitle: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    historySection: {
        gap: Theme.spacing.sm,
    },
    sectionLabel: {
        fontSize: 17,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    historyList: {
        gap: Theme.spacing.sm,
        paddingRight: Theme.spacing.md,
    },
    historyCard: {
        width: 110,
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.background.surface.light,
        ...Theme.shadows.sm,
    },
    historyThumb: {
        width: 110,
        height: 140,
        backgroundColor: Theme.colors.border,
    },
    historyMeta: {
        padding: 8,
        gap: 2,
    },
    historyScore: {
        fontSize: 14,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.palette.primary,
    },
    historyDate: {
        fontSize: 11,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
    },
    loadingHistory: {
        paddingVertical: Theme.spacing.md,
        alignItems: 'center',
    },
});
