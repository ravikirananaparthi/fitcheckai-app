import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { sendChatMessage } from '@/src/services/api/fitcheck.service';
import type { ChatMessage } from '@/src/types/fitcheck.types';

interface Props {
    fitCheckId: string;
    initialMessages: ChatMessage[];
    onBack: () => void;
}

export function FitCheckChatScreen({ fitCheckId, initialMessages, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef<FlatList>(null);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput('');
        setSending(true);

        // Optimistic user message
        const tempMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            fitCheckId,
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMsg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const reply = await sendChatMessage(fitCheckId, text);
            setMessages((prev) => [...prev, reply]);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    fitCheckId,
                    role: 'assistant',
                    content: 'Sorry, I had trouble responding. Try again.',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setSending(false);
        }
    }, [input, sending, fitCheckId]);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>AI</Text>
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.aiDot} />
                    <Text style={styles.headerTitle}>AI Stylist</Text>
                </View>
                <View style={{ width: 60 }} />
            </View>

            {/* Messages */}
            <FlatList
                ref={listRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
                onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <View style={styles.emptyChat}>
                        <Text style={styles.emptyChatText}>
                            Ask me anything about your outfit — what to change, what shoes to pair, how to dress it up or down.
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    sending ? (
                        <View style={[styles.msgRow]}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>AI</Text>
                            </View>
                            <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                                <ActivityIndicator size="small" color={Theme.colors.text.secondary} />
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Input bar */}
            <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask your AI stylist..."
                    placeholderTextColor={Theme.colors.text.tertiary}
                    multiline
                    maxLength={500}
                    onSubmitEditing={send}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                    onPress={send}
                    disabled={!input.trim() || sending}
                    activeOpacity={0.8}
                >
                    <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backBtn: { width: 60, paddingVertical: 4 },
    backText: {
        fontSize: 14,
        color: Theme.palette.primary,
        fontFamily: 'GoogleSansFlex_500Medium',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    aiDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: Theme.colors.text.primary,
    },
    listContent: {
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.md,
        gap: 12,
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 12,
    },
    msgRowUser: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Theme.palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontSize: 10,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111',
    },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    aiBubble: {
        backgroundColor: Theme.colors.background.surface.light,
        borderBottomLeftRadius: 4,
        ...Theme.shadows.sm,
    },
    userBubble: {
        backgroundColor: Theme.palette.primary,
        borderBottomRightRadius: 4,
    },
    bubbleText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.primary,
        lineHeight: 22,
    },
    userBubbleText: {
        color: '#111111',
    },
    typingBubble: {
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    emptyChat: {
        padding: Theme.spacing.xl,
        alignItems: 'center',
    },
    emptyChatText: {
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Theme.spacing.md,
        paddingTop: Theme.spacing.sm,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        backgroundColor: Theme.colors.background.light,
    },
    input: {
        flex: 1,
        backgroundColor: Theme.colors.background.surface.light,
        borderRadius: Theme.radius.xl,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: 'GoogleSansFlex_400Regular',
        color: Theme.colors.text.primary,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Theme.palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 1,
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
    sendIcon: {
        fontSize: 18,
        fontFamily: 'GoogleSansFlex_700Bold',
        color: '#111111',
    },
});
