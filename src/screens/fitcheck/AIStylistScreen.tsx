import { Theme } from '@/constants/theme';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowRight, Camera, Check, ChevronRight, ImagePlus, RefreshCw, Sparkles, X } from 'lucide-react-native';
import { analyzeFitCheck, getFitCheckStatus, getFitCheckHistory, getFitCheck } from '@/src/services/api/fitcheck.service';
import { FitCheckResultScreen } from './FitCheckResultScreen';
import { router } from 'expo-router';
import type { FitCheck } from '@/src/types/fitcheck.types';

type ScreenState = { view: 'idle' } | { view: 'uploading' } | { view: 'analyzing'; fitCheckId: string } | { view: 'result'; fitCheck: FitCheck };
const occasions = ['Everyday', 'Work', 'Date', 'Party'];

export default function AIStylistScreen({ initialSource, onClose, embedded = false }: { initialSource?: 'camera' | 'gallery'; onClose?: () => void; embedded?: boolean }) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const wide = width >= 760;
    const [state, setState] = useState<ScreenState>({ view: 'idle' });
    const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [occasion, setOccasion] = useState('Everyday');
    const [error, setError] = useState('');
    const [history, setHistory] = useState<FitCheck[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(true);

    const loadHistory = useCallback(async () => {
        try { const res = await getFitCheckHistory(); if (mounted.current) setHistory(res.items.filter(c => c.jobStatus === 'COMPLETED')); } catch { /* History is optional. */ }
    }, []);
    useEffect(() => { mounted.current = true; loadHistory(); return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, [loadHistory]);

    const pickPhoto = async (source: 'camera' | 'gallery') => {
        setError('');
        try {
            if (Platform.OS !== 'web') {
                const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) { setError(`Please allow ${source === 'camera' ? 'camera' : 'photo library'} access in Settings.`); return; }
            }
            const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
            const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled && result.assets[0]) setPhoto(result.assets[0]);
        } catch { setError('Could not open your photos. Please try again.'); }
    };

    useEffect(() => { if (initialSource) void pickPhoto(initialSource); }, [initialSource]);

    const startAnalysis = async () => {
        if (!photo || state.view !== 'idle') return;
        setError(''); setState({ view: 'uploading' });
        try {
            const job = await analyzeFitCheck(photo.uri, occasion === 'Everyday' ? 'casual everyday' : occasion, photo.mimeType, photo.fileName);
            if (!mounted.current) return;
            setState({ view: 'analyzing', fitCheckId: job.fitCheckId });
            let attempts = 0;
            const poll = async () => {
                attempts++;
                try {
                    const check = await getFitCheckStatus(job.fitCheckId);
                    if (!mounted.current) return;
                    if (check.jobStatus === 'COMPLETED') { setState({ view: 'result', fitCheck: check }); loadHistory(); return; }
                    if (check.jobStatus === 'FAILED') { setError('We couldn’t analyze this photo. Please try again.'); setState({ view: 'idle' }); return; }
                } catch { /* Retry temporary connection errors within the same limit. */ }
                if (!mounted.current) return;
                if (attempts >= 60) { setError('This is taking longer than expected. Please try again or check your recent looks later.'); setState({ view: 'idle' }); return; }
                timer.current = setTimeout(poll, 2000);
            };
            poll();
        } catch (err: any) {
            if (mounted.current) { setError(err?.message === 'Network Error' ? 'Can’t reach the server. Check your connection and try again.' : (err?.message || 'Upload failed. Please try again.')); setState({ view: 'idle' }); }
        }
    };
    const openHistory = async (id: string) => {
        try { const full = await getFitCheck(id); setState({ view: 'result', fitCheck: full }); }
        catch { setError('Couldn’t load this look. Please try again.'); }
    };
    if (state.view === 'result') {
        return (
            <FitCheckResultScreen
                embedded={embedded}
                fitCheck={state.fitCheck}
                onChatPress={() => router.push({ pathname: '/stylist', params: { fitCheckId: state.fitCheck.id } })}
                onNewCheck={() => { setPhoto(null); setState({ view: 'idle' }); }}
            />
        );
    }
    const busy = state.view !== 'idle';

    const content = <View style={[styles.page, embedded && { paddingHorizontal: 0, paddingTop: 8 }]}>
            {onClose && <TouchableOpacity onPress={onClose} disabled={busy} accessibilityRole="button" accessibilityLabel="Close fit check" style={{ paddingVertical: 12 }}><Text style={{ color: '#504658', fontSize: 16 }}>Close fit check</Text></TouchableOpacity>}
            <View style={styles.topline}><View style={styles.eyebrowDot} /><Text style={styles.eyebrow}>YOUR PERSONAL STYLE STUDIO</Text></View>
            <View style={styles.headingRow}><View style={{ flex: 1 }}><Text style={styles.heading}>A little confidence{ '\n' }for every look.</Text><Text style={styles.intro}>Your outfit, a fresh perspective. Let’s make getting dressed feel good.</Text></View><View style={styles.headingIcon}><Sparkles size={22} color="#1B1427" /></View></View>
            <View style={[styles.layout, wide && styles.layoutWide]}>
                <View style={[styles.mainCard, wide && styles.mainWide]}>
                    <View style={styles.cardHeader}><View><Text style={styles.cardEyebrow}>THE FIT CHECK</Text><Text style={styles.cardTitle}>{photo ? 'Looking good already.' : 'Start with your outfit.'}</Text></View><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>01 / 02</Text></View></View>
                    <Text style={styles.cardDescription}>{photo ? 'Take a look at your photo before we get started.' : 'Choose a photo and get thoughtful, personalized feedback in moments.'}</Text>
                    {photo ? <View style={styles.previewWrap}><Image source={{ uri: photo.uri }} style={styles.preview} contentFit="contain" /><TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)} disabled={busy} accessibilityRole="button" accessibilityLabel="Remove photo"><X size={18} color="#fff" /></TouchableOpacity><View style={styles.photoTag}><Check size={13} color="#fff" /><Text style={styles.photoTagText}>PHOTO READY</Text></View></View> : <TouchableOpacity style={styles.dropzone} onPress={() => pickPhoto('gallery')} accessibilityRole="button" accessibilityLabel="Choose outfit photo"><View style={styles.uploadIcon}><ImagePlus size={26} color="#504658" strokeWidth={1.6} /></View><Text style={styles.dropTitle}>Add your outfit photo</Text><Text style={styles.dropSub}>Choose a clear, full-length photo</Text><View style={styles.choosePill}><Text style={styles.choosePillText}>Choose a photo</Text><ArrowRight size={15} color="#1B1427" /></View></TouchableOpacity>}
                    <View style={styles.sourceRow}><TouchableOpacity style={styles.sourceButton} disabled={busy} onPress={() => pickPhoto('gallery')} accessibilityRole="button"><ImagePlus size={17} color="#504658" /><Text style={styles.sourceText}>{photo ? 'Change photo' : 'Photo library'}</Text></TouchableOpacity>{Platform.OS !== 'web' && <TouchableOpacity style={styles.sourceButton} disabled={busy} onPress={() => pickPhoto('camera')} accessibilityRole="button"><Camera size={17} color="#504658" /><Text style={styles.sourceText}>Take a photo</Text></TouchableOpacity>}</View>
                    {error ? <View style={styles.errorBox} accessibilityRole="alert"><Text style={styles.errorText}>{error}</Text></View> : null}
                </View>
                <View style={[styles.side, wide && styles.sideWide]}>
                    <View style={styles.detailsCard}><View style={styles.cardHeader}><View><Text style={styles.cardEyebrow}>MAKE IT PERSONAL</Text><Text style={styles.detailsTitle}>What’s the occasion?</Text></View><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>02 / 02</Text></View></View><Text style={styles.detailsSub}>We’ll tailor your feedback to your plans.</Text><View style={styles.chips}>{occasions.map(item => <TouchableOpacity key={item} disabled={busy} onPress={() => setOccasion(item)} accessibilityRole="button" accessibilityState={{ selected: occasion === item }} style={[styles.chip, occasion === item && styles.chipSelected]}><Text style={[styles.chipText, occasion === item && styles.chipTextSelected]}>{item}</Text></TouchableOpacity>)}</View>
                        <TouchableOpacity accessibilityRole="button" disabled={!photo || busy} onPress={startAnalysis} style={[styles.analyzeButton, (!photo || busy) && styles.analyzeDisabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Sparkles size={17} color="#fff" />}<Text style={styles.analyzeText}>{state.view === 'uploading' ? 'Uploading your photo…' : state.view === 'analyzing' ? 'Analyzing your look…' : 'Analyze my outfit'}</Text>{!busy && <ArrowRight size={18} color="#fff" />}</TouchableOpacity><Text style={styles.underButton}>{busy ? 'This can take a little while. Keep this screen open.' : 'A fresh take, just for you.'}</Text>
                    </View>
                    <View style={styles.tipsCard}><View style={styles.tipIcon}><Sparkles size={17} color="#504658" /></View><View style={{ flex: 1 }}><Text style={styles.tipTitle}>For the best fit check</Text><Text style={styles.tipText}>Good light and a head-to-toe view help us see the details that make your look yours.</Text></View></View>
                </View>
            </View>
            {history.length > 0 && <View style={styles.history}><View style={styles.historyHeader}><View><Text style={styles.cardEyebrow}>YOUR STYLE JOURNEY</Text><Text style={styles.historyTitle}>Recent looks</Text></View><RefreshCw size={18} color="#71677A" /></View><FlashList horizontal data={history} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} renderItem={({item}) => <TouchableOpacity style={styles.historyCard} onPress={() => openHistory(item.id)} accessibilityRole="button"><Image source={{uri: item.imageUrl}} style={styles.historyImage} contentFit="cover" /><View style={styles.historyInfo}><Text style={styles.historyScore}>{item.score?.toFixed(1) ?? '—'} <Text style={styles.historyOutOf}>/ 10</Text></Text><ChevronRight size={16} color="#71677A" /></View></TouchableOpacity>} /></View>}
        </View>;
    if (embedded) return content;
    return <View style={[styles.root, { paddingTop: insets.top }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>{content}</ScrollView></View>;
}

const styles = StyleSheet.create({
 root:{flex:1,backgroundColor:Theme.colors.background.light},page:{width:'100%',maxWidth:1120,alignSelf:'center',paddingHorizontal:22,paddingTop:30},topline:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14},eyebrowDot:{width:7,height:7,borderRadius:4,backgroundColor:'#9874BB'},eyebrow:{fontFamily:'GoogleSansFlex_700Bold',fontSize:10,letterSpacing:1.8,color:'#71677A'},headingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:30},heading:{fontFamily:'GoogleSansFlex_700Bold',fontSize:35,lineHeight:40,letterSpacing:-1.5,color:'#1B1427'},intro:{fontFamily:'GoogleSansFlex_400Regular',fontSize:15,lineHeight:23,color:'#71677A',marginTop:10,maxWidth:480},headingIcon:{width:44,height:44,borderRadius:22,backgroundColor:'#EEE5FA',alignItems:'center',justifyContent:'center'},layout:{gap:16},layoutWide:{flexDirection:'row',alignItems:'flex-start',gap:20},mainCard:{backgroundColor:'#fff',borderRadius:24,padding:22,borderWidth:1,borderColor:'#EEE5FA'},mainWide:{flex:1.25,padding:28},side:{gap:16},sideWide:{flex:1},cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:8},cardEyebrow:{fontFamily:'GoogleSansFlex_700Bold',fontSize:10,letterSpacing:1.5,color:'#9874BB'},cardTitle:{fontFamily:'GoogleSansFlex_700Bold',fontSize:22,letterSpacing:-0.6,color:'#1B1427',marginTop:7},stepBadge:{borderWidth:1,borderColor:'#EEE5FA',borderRadius:20,paddingVertical:7,paddingHorizontal:10},stepBadgeText:{fontFamily:'GoogleSansFlex_700Bold',fontSize:10,color:'#9874BB',letterSpacing:0.7},cardDescription:{fontFamily:'GoogleSansFlex_400Regular',fontSize:14,lineHeight:21,color:'#71677A',marginTop:8,marginBottom:20},dropzone:{minHeight:252,borderWidth:1.5,borderStyle:'dashed',borderColor:'#DCC6F5',backgroundColor:'#F5F1FA',borderRadius:18,alignItems:'center',justifyContent:'center',padding:20},uploadIcon:{width:54,height:54,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'#EEE5FA',marginBottom:14},dropTitle:{fontFamily:'GoogleSansFlex_700Bold',fontSize:17,color:'#1B1427'},dropSub:{fontFamily:'GoogleSansFlex_400Regular',fontSize:13,color:'#9874BB',marginTop:5},choosePill:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#EEE5FA',paddingHorizontal:15,paddingVertical:10,borderRadius:20,marginTop:18},choosePillText:{fontFamily:'GoogleSansFlex_700Bold',fontSize:12,color:'#504658'},previewWrap:{height:300,borderRadius:18,overflow:'hidden',backgroundColor:'#EEE5FA'},preview:{width:'100%',height:'100%'},removePhoto:{position:'absolute',right:12,top:12,width:36,height:36,borderRadius:18,backgroundColor:'#1B1427CC',alignItems:'center',justifyContent:'center'},photoTag:{position:'absolute',bottom:12,left:12,backgroundColor:'#1B1427DD',borderRadius:16,paddingHorizontal:10,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5},photoTagText:{color:'#fff',fontFamily:'GoogleSansFlex_700Bold',fontSize:9,letterSpacing:1},sourceRow:{flexDirection:'row',gap:10,marginTop:14},sourceButton:{flex:1,minHeight:46,borderWidth:1,borderColor:'#EEE5FA',borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},sourceText:{fontFamily:'GoogleSansFlex_600SemiBold',fontSize:13,color:'#504658'},detailsCard:{backgroundColor:'#fff',borderRadius:24,padding:22,borderWidth:1,borderColor:'#EEE5FA'},detailsTitle:{fontFamily:'GoogleSansFlex_700Bold',fontSize:20,letterSpacing:-0.5,color:'#1B1427',marginTop:7},detailsSub:{fontFamily:'GoogleSansFlex_400Regular',fontSize:13,color:'#9874BB',marginTop:8,lineHeight:20},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:18,marginBottom:24},chip:{paddingVertical:10,paddingHorizontal:15,borderWidth:1,borderColor:'#EEE5FA',borderRadius:20},chipSelected:{backgroundColor:'#EEE5FA',borderColor:'#DCC6F5'},chipText:{fontFamily:'GoogleSansFlex_600SemiBold',fontSize:13,color:'#71677A'},chipTextSelected:{color:'#504658'},analyzeButton:{height:54,borderRadius:14,backgroundColor:Theme.palette.primary,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:10},analyzeDisabled:{opacity:0.55},analyzeText:{fontFamily:'GoogleSansFlex_700Bold',fontSize:14,color:'#fff'},underButton:{textAlign:'center',fontFamily:'GoogleSansFlex_400Regular',fontSize:11,color:'#9874BB',marginTop:12},tipsCard:{backgroundColor:'#EEE5FA',borderRadius:20,padding:19,flexDirection:'row',gap:13},tipIcon:{width:35,height:35,borderRadius:12,backgroundColor:'#EEE5FA',alignItems:'center',justifyContent:'center'},tipTitle:{fontFamily:'GoogleSansFlex_700Bold',fontSize:14,color:'#504658'},tipText:{fontFamily:'GoogleSansFlex_400Regular',fontSize:13,lineHeight:20,color:'#71677A',marginTop:4},errorBox:{backgroundColor:'#FFF1EC',padding:13,borderRadius:12,marginTop:14},errorText:{fontFamily:'GoogleSansFlex_600SemiBold',fontSize:13,lineHeight:19,color:'#A14735'},history:{marginTop:34},historyHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},historyTitle:{fontFamily:'GoogleSansFlex_700Bold',fontSize:22,color:'#1B1427',marginTop:6},historyCard:{width:130,marginRight:12,backgroundColor:'#fff',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#EEE5FA'},historyImage:{width:'100%',height:150},historyInfo:{padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},historyScore:{fontFamily:'GoogleSansFlex_700Bold',fontSize:16,color:'#504658'},historyOutOf:{fontSize:11,color:'#9874BB'}
});
