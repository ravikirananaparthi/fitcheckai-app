import { FontFamily, Theme } from '@/constants/theme';
import {
    getConversation, listConversations, openConversation, sendStylistTurn,
    type StylistConversation, type StylistDraft, type StylistPiece, type WeatherChoice,
} from '@/src/services/api/stylist.service';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Link, router, useFocusEffect } from 'expo-router';
import { ArrowLeft, ArrowUp, ChevronRight, CloudSun, History, ImagePlus, Plus, Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ink = '#23182F';
const secondary = '#62566D';
const purple = '#603496';
const tint = '#EEE4FA';
const border = '#E4D9ED';
const listKey = ['stylist', 'conversations'];
const chatKey = (id?: string) => ['stylist', 'conversation', id];
const starters = ['Style an outfit for dinner', 'Build a look from my wardrobe', 'What goes with this piece?'];

type Message = {
    id: string;
    role: string;
    content: string;
    imageUrl?: string | null;
    wardrobe?: StylistPiece[];
    weatherLabel?: string | null;
};

function messagesFor(chat?: StylistConversation): Message[] {
    if (!chat) return [];
    return [...chat.legacyMessages, ...chat.turns.flatMap((turn) => [
        { id: `${turn.id}-question`, role: 'user', content: turn.question, imageUrl: turn.imageUrl },
        { id: turn.id, role: 'assistant', content: turn.answer, wardrobe: turn.wardrobe, weatherLabel: turn.weatherLabel },
    ])];
}

function ContextCard({ fitCheck }: { fitCheck: NonNullable<StylistConversation['fitCheck']> }) {
    const summary = fitCheck.feedback?.summary?.trim();
    const hasScore = Number.isFinite(fitCheck.score) && !!summary && !/^n\/?a\.?$/i.test(summary);
    return (
        <View style={styles.contextCard}>
            <Image source={fitCheck.imageUrl} style={styles.contextImage} accessibilityLabel="Fit Check outfit" />
            <View style={styles.copy}>
                <Text style={styles.label}>{hasScore ? `Fit Check · ${fitCheck.score}/10` : 'Fit Check photo'}</Text>
                <Text style={styles.body} numberOfLines={3}>{hasScore ? summary : 'Ask about this look or add a clearer photo.'}</Text>
            </View>
        </View>
    );
}

function ChatMessage({ message }: { message: Message }) {
    const user = message.role === 'user';
    return (
        <View style={[styles.bubble, user && styles.userBubble]}>
            {message.imageUrl && <Image source={message.imageUrl} contentFit="contain" style={styles.messageImage} accessibilityLabel="Outfit attachment" />}
            {!!message.content && <Text selectable style={styles.body}>{message.content}</Text>}
            {!!message.weatherLabel && <Text style={styles.meta}>{message.weatherLabel}</Text>}
            {!!message.wardrobe?.length && (
                <View style={styles.pieces}>
                    <Text style={styles.label}>From your wardrobe</Text>
                    {message.wardrobe.map((piece) => (
                        <Link href={{ pathname: '/wardrobe', params: { itemId: piece.id } }} key={piece.id} asChild>
                            <Pressable style={styles.piece}>
                                <Image source={piece.imageUrl} style={styles.pieceImage} accessible={false} />
                                <Text style={[styles.body, styles.copy]}>{piece.label}</Text>
                                <ChevronRight size={16} color={purple} />
                            </Pressable>
                        </Link>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function StylistChatScreen({ fitCheckId, standalone = false }: { fitCheckId?: string; standalone?: boolean } = {}) {
    const insets = useSafeAreaInsets();
    const cache = useQueryClient();
    const list = useRef<FlashListRef<Message>>(null);
    const sending = useRef(false);
    const [conversationId, setConversationId] = useState<string>();
    const [history, setHistory] = useState(false);
    const [question, setQuestion] = useState('');
    const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [requestId, setRequestId] = useState<string>();
    const [weatherOpen, setWeatherOpen] = useState(false);
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState<WeatherChoice | null>(null);
    const [locating, setLocating] = useState(false);
    const [pending, setPending] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [error, setError] = useState('');
    const [failed, setFailed] = useState(false);
    const [draftTurn, setDraftTurn] = useState<StylistDraft>();

    const linked = useQuery({
        queryKey: ['stylist', 'fitCheck', fitCheckId],
        queryFn: () => openConversation(fitCheckId),
        enabled: !!fitCheckId,
    });
    const id = conversationId ?? linked.data?.id;
    const chat = useQuery({ queryKey: chatKey(id), queryFn: () => getConversation(id!), enabled: !!id, staleTime: 0 });
    const chats = useQuery({ queryKey: listKey, queryFn: listConversations, enabled: history, staleTime: 0 });
    useFocusEffect(useCallback(() => {
        if (id) void cache.invalidateQueries({ queryKey: chatKey(id) });
    }, [cache, id]));
    useFocusEffect(useCallback(() => {
        if (!history) return;
        const listener = BackHandler.addEventListener('hardwareBackPress', () => {
            setHistory(false);
            return true;
        });
        return () => listener.remove();
    }, [history]));

    useEffect(() => {
        const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    const messages = messagesFor(chat.data);
    if (draftTurn) {
        messages.push({ id: draftTurn.requestId, role: 'user', content: draftTurn.question, imageUrl: draftTurn.photo?.uri });
    }

    useEffect(() => {
        if (!messages.length) return;
        const frame = requestAnimationFrame(() => list.current?.scrollToEnd({ animated: false }));
        return () => cancelAnimationFrame(frame);
    }, [id, messages.length]);

    function changeDraft() {
        setRequestId(undefined);
        setError('');
        setFailed(false);
    }

    function selectConversation(next?: string) {
        setConversationId(next);
        setHistory(false);
        setQuestion('');
        setPhoto(null);
        setWeather(null);
        setWeatherOpen(false);
        changeDraft();
    }

    async function pickPhoto() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                if ((asset.fileSize && asset.fileSize > 10 * 1024 * 1024) ||
                    (asset.mimeType && !/^image\/(jpeg|png|webp)$/.test(asset.mimeType))) {
                    setFailed(false);
                    setError('Choose a JPEG, PNG, or WebP photo under 10 MB.');
                    return;
                }
                changeDraft();
                setPhoto(asset);
            }
        } catch {
            setFailed(false);
            setError('Couldn’t open the photo library. Try again.');
        }
    }

    async function selectDeviceLocation() {
        setLocating(true);
        changeDraft();
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (!permission.granted) {
                setError('Location access is off. You can enter a city below.');
                return;
            }
            const location = await Location.getLastKnownPositionAsync({ maxAge: 300000, requiredAccuracy: 5000 })
                ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            setWeather({
                latitude: Math.round(location.coords.latitude * 100) / 100,
                longitude: Math.round(location.coords.longitude * 100) / 100,
            });
            setWeatherOpen(false);
        } catch {
            setError('Couldn’t get your location. Enter a city below.');
        } finally {
            setLocating(false);
        }
    }

    async function send() {
        if (sending.current || (!question.trim() && !photo)) return;
        const draft = { requestId: requestId ?? Crypto.randomUUID(), question: question.trim(), photo, weather };
        sending.current = true;
        setRequestId(draft.requestId);
        setPending(true);
        setWeatherOpen(false);
        setDraftTurn(draft);
        setFailed(false);
        setError('');
        try {
            let target = id;
            if (!target) {
                target = (await openConversation()).id;
                setConversationId(target);
            }
            const result = await sendStylistTurn(target, draft);
            cache.setQueryData(chatKey(target), result);
            void cache.invalidateQueries({ queryKey: listKey });
            setQuestion('');
            setPhoto(null);
            setRequestId(undefined);
        } catch (err) {
            setFailed(true);
            setError(err instanceof Error ? err.message : 'Couldn’t send your message.');
        } finally {
            sending.current = false;
            setPending(false);
            setDraftTurn(undefined);
        }
    }

    const loading = (!!fitCheckId && linked.isPending) || (!!id && chat.isPending);
    const loadFailed = id ? chat.isError && !chat.data : linked.isError;
    const canSend = !pending && !loading && !loadFailed && !locating && (!!question.trim() || !!photo);
    const tabBottom = standalone ? insets.bottom : Platform.OS === 'ios' ? insets.bottom + 55 : 0;

    return (
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: keyboardVisible ? 0 : tabBottom }]}>
            <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    {(standalone || history) && (
                        <Pressable
                            accessibilityRole="button" accessibilityLabel="Back"
                            style={styles.iconButton}
                            onPress={() => history ? setHistory(false) : router.canGoBack() ? router.back() : router.replace('/ai-stylist')}
                        ><ArrowLeft size={22} color={ink} /></Pressable>
                    )}
                    <Text accessibilityRole="header" style={styles.title}>{history ? 'Conversations' : 'AI Stylist'}</Text>
                    {!standalone && !history && (
                        <>
                            <Pressable disabled={pending || locating} accessibilityRole="button" accessibilityLabel="Conversation history" style={styles.iconButton} onPress={() => setHistory(true)}>
                                <History size={21} color={purple} />
                            </Pressable>
                            <Pressable disabled={pending || locating} accessibilityRole="button" accessibilityLabel="New conversation" style={styles.iconButton} onPress={() => selectConversation()}>
                                <Plus size={23} color={purple} />
                            </Pressable>
                        </>
                    )}
                </View>
                {history ? (
                    <FlashList
                        data={chats.data ?? []}
                        contentContainerStyle={styles.thread}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={chats.isPending ? <ActivityIndicator color={purple} /> :
                            chats.isError ? <Pressable style={styles.pill} onPress={() => void chats.refetch()}><Text style={styles.label}>Couldn’t load history. Retry</Text></Pressable> :
                            <Text style={styles.body}>Your conversations will appear here.</Text>}
                        renderItem={({ item }) => (
                            <Pressable accessibilityRole="button" style={styles.historyRow} onPress={() => selectConversation(item.id)}>
                                <Text style={[styles.label, styles.copy]}>{item.title}</Text>
                                <ChevronRight size={17} color={purple} />
                            </Pressable>
                        )}
                    />
                ) : (
                    <>
                        <FlashList
                            ref={list}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.thread}
                            renderItem={({ item }) => <ChatMessage message={item} />}
                            ListHeaderComponent={chat.data?.fitCheck ? <ContextCard fitCheck={chat.data.fitCheck} /> : null}
                            ListEmptyComponent={loading ? <ActivityIndicator color={purple} /> :
                                loadFailed ? (
                                    <Pressable style={styles.pill} onPress={() => void (id ? chat.refetch() : linked.refetch())}>
                                        <Text style={styles.label}>Couldn’t load conversation. Retry</Text>
                                    </Pressable>
                                ) : (
                                    <View style={styles.intro}>
                                        <View style={styles.heroIcon}><Sparkles size={23} color={purple} /></View>
                                        <Text accessibilityRole="header" style={styles.headline}>
                                            {chat.data?.fitCheck ? 'Let’s style this look' : 'What are you getting dressed for?'}
                                        </Text>
                                        <Text style={styles.body}>Describe the occasion or add an outfit photo.</Text>
                                        {(chat.data?.fitCheck ? ['What shoes go with this?', 'How could I dress this up?'] : starters).map((starter) => (
                                            <Pressable key={starter} accessibilityRole="button" style={styles.pill} onPress={() => { setQuestion(starter); changeDraft(); }}>
                                                <Text style={styles.label}>{starter}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            ListFooterComponent={pending ? <Text accessibilityLiveRegion="polite" style={styles.meta}>Stylist is replying…</Text> : null}
                        />
                        <View style={styles.composer}>
                            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
                            {photo && !pending && (
                                <View style={styles.attachment}>
                                    <Image source={photo.uri} style={styles.pieceImage} accessibilityLabel="Photo ready to send" />
                                    <Text style={[styles.label, styles.copy]}>Outfit photo</Text>
                                    <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.iconButton} onPress={() => { setPhoto(null); changeDraft(); }}>
                                        <X size={19} color={purple} />
                                    </Pressable>
                                </View>
                            )}
                            {weatherOpen && (
                                <View style={styles.weatherBox}>
                                    <Text style={styles.label}>Add weather to your advice</Text>
                                    <TextInput accessibilityLabel="City for weather" placeholder="City, e.g. Mumbai" value={city} onChangeText={setCity} editable={!locating} maxLength={120} style={styles.field} />
                                    <View style={styles.weatherActions}>
                                        <Pressable disabled={!city.trim() || locating} accessibilityRole="button" style={styles.pill} onPress={() => { setWeather({ city: city.trim() }); setWeatherOpen(false); changeDraft(); }}>
                                            <Text style={styles.label}>Use city</Text>
                                        </Pressable>
                                        <Pressable disabled={locating} accessibilityRole="button" style={styles.pill} onPress={() => void selectDeviceLocation()}>
                                            <Text style={styles.label}>{locating ? 'Finding location…' : 'Use my location'}</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                            <Pressable disabled={pending || locating} accessibilityRole="button" style={styles.weatherToggle} onPress={() => {
                                if (weather) { setWeather(null); changeDraft(); }
                                else setWeatherOpen(!weatherOpen);
                            }}>
                                <CloudSun size={17} color={purple} />
                                <Text style={styles.label}>{weather ? ('city' in weather ? weather.city : 'Local weather') : 'Add weather'}</Text>
                                {!!weather && <X size={14} color={purple} />}
                            </Pressable>
                            <View style={styles.inputRow}>
                                <Pressable disabled={pending} accessibilityRole="button" accessibilityLabel="Add outfit photo" style={styles.iconButton} onPress={() => void pickPhoto()}>
                                    <ImagePlus size={22} color={purple} />
                                </Pressable>
                                <TextInput
                                    accessibilityLabel="Message your stylist"
                                    placeholder="Ask your stylist"
                                    placeholderTextColor={secondary}
                                    value={question}
                                    onChangeText={(value) => { setQuestion(value); changeDraft(); }}
                                    editable={!pending}
                                    multiline
                                    maxLength={2000}
                                    style={[styles.field, styles.messageField]}
                                />
                                <Pressable disabled={!canSend} accessibilityRole="button" accessibilityLabel={failed ? 'Retry message' : 'Send message'} onPress={() => void send()} style={[styles.send, !canSend && styles.disabled]}>
                                    {pending ? <ActivityIndicator color="#fff" /> : <ArrowUp size={22} color="#fff" />}
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Theme.colors.background.light },
    page: { width: '100%', maxWidth: 760, flex: 1, alignSelf: 'center' },
    header: { minHeight: 57, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
    title: { flex: 1, fontFamily: FontFamily.bold, fontSize: 22, color: ink },
    headline: { fontFamily: FontFamily.bold, fontSize: 27, letterSpacing: -0.7, color: ink },
    label: { fontFamily: FontFamily.semibold, fontSize: 14, color: purple },
    body: { fontFamily: FontFamily.regular, fontSize: 16, color: ink },
    meta: { fontFamily: FontFamily.regular, color: secondary, fontSize: 13, marginTop: 6 },
    copy: { flex: 1, gap: 3 },
    iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    thread: { padding: 16 },
    intro: { alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
    heroIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderCurve: 'continuous', backgroundColor: tint },
    pill: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: border, borderRadius: 13, backgroundColor: '#fff' },
    contextCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: tint, borderRadius: 18, borderCurve: 'continuous', marginBottom: 15 },
    contextImage: { width: 54, height: 66, borderRadius: 9, backgroundColor: '#fff' },
    bubble: { alignSelf: 'flex-start', maxWidth: '90%', padding: 13, gap: 8, backgroundColor: '#fff', borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: border, marginBottom: 12 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: tint },
    messageImage: { width: 180, maxWidth: '100%', height: 180, borderRadius: 10, backgroundColor: tint },
    pieces: { gap: 5 },
    piece: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
    pieceImage: { width: 38, height: 38, borderRadius: 8, backgroundColor: tint },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border },
    composer: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, gap: 6, borderTopWidth: 1, borderTopColor: border, backgroundColor: Theme.colors.background.light },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    field: { minHeight: 44, borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: '#fff', padding: 10, fontFamily: FontFamily.regular, fontSize: 16, color: ink },
    messageField: { flex: 1, maxHeight: 110 },
    send: { width: 44, height: 44, backgroundColor: purple, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
    disabled: { opacity: 0.45 },
    error: { color: '#932F35', fontSize: 14, fontFamily: FontFamily.regular },
    attachment: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    weatherToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, gap: 7, paddingHorizontal: 8 },
    weatherBox: { gap: 7 },
    weatherActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
