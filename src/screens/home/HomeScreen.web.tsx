import { FontFamily, Theme } from '@/constants/theme';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, Camera, Shirt, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import DailyStyleTip from './components/DailyStyleTip';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>YOUR PERSONAL STYLE SPACE</Text>
          <Text style={styles.pageTitle}>Good style starts here.</Text>
          <Text style={styles.intro}>A little inspiration, a lot more confidence.</Text>
        </View>
      </View>

      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={styles.heroCopy}>
          <View style={styles.badge}><Sparkles size={14} color={Theme.palette.primaryDark} /><Text style={styles.badgeText}>YOUR AI STYLIST</Text></View>
          <Text style={styles.heroTitle}>Love what you wear.</Text>
          <Text style={styles.heroDescription}>Get a fresh perspective on your outfit, with thoughtful feedback and styling tips made for you.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/ai-stylist')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Get a fit check</Text><ArrowRight size={18} color="#fff" />
          </Pressable>
        </View>
        <Image source={require('@/assets/images/heromg.png')} style={[styles.heroImage, wide && styles.heroImageWide]} contentFit="cover" contentPosition="center" />
      </View>

      <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>MADE FOR YOU</Text><Text style={styles.sectionTitle}>Your style toolkit</Text></View></View>
      <View style={[styles.toolGrid, !wide && styles.toolGridCompact]}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/ai-stylist')} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.iconBox}><Camera size={22} color={Theme.palette.primaryDark} /></View>
          <Text style={styles.toolTitle}>Check an outfit</Text><Text style={styles.toolDescription}>Upload a look and get personalized feedback in moments.</Text>
          <View style={styles.toolLink}><Text style={styles.toolLinkText}>Open AI Stylist</Text><ArrowRight size={16} color={Theme.palette.primaryDark} /></View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/wardrobe')} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.iconBox}><Shirt size={22} color={Theme.palette.primaryDark} /></View>
          <Text style={styles.toolTitle}>Explore your wardrobe</Text><Text style={styles.toolDescription}>Keep your pieces together and find new ways to wear them.</Text>
          <View style={styles.toolLink}><Text style={styles.toolLinkText}>Open wardrobe</Text><ArrowRight size={16} color={Theme.palette.primaryDark} /></View>
        </Pressable>
      </View>
      <View style={styles.tip}><DailyStyleTip /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FA' },
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 48, paddingBottom: 80 },
  heading: { marginBottom: 30 },
  eyebrow: { color: Theme.palette.primaryDark, fontFamily: FontFamily.bold, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  pageTitle: { color: '#211A29', fontFamily: FontFamily.bold, fontSize: 34, lineHeight: 42, letterSpacing: -1 },
  intro: { color: '#716B77', fontFamily: FontFamily.regular, fontSize: 16, marginTop: 7 },
  hero: { backgroundColor: '#EEE8F2', borderRadius: 24, overflow: 'hidden' },
  heroWide: { flexDirection: 'row', minHeight: 360 },
  heroCopy: { flex: 1, padding: 36, justifyContent: 'center', alignItems: 'flex-start' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20 },
  badgeText: { color: Theme.palette.primaryDark, fontFamily: FontFamily.bold, fontSize: 10, letterSpacing: 1 },
  heroTitle: { color: '#211A29', fontFamily: FontFamily.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, maxWidth: 400 },
  heroDescription: { color: '#655C69', fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 25, marginTop: 16, maxWidth: 410 },
  primaryButton: { backgroundColor: '#29202F', flexDirection: 'row', alignItems: 'center', gap: 24, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 15, marginTop: 26 },
  primaryButtonText: { color: '#FFF', fontFamily: FontFamily.bold, fontSize: 14 },
  heroImage: { width: '100%', height: 260 },
  heroImageWide: { width: '43%', height: 'auto', minHeight: 360 },
  sectionHeading: { marginTop: 44, marginBottom: 20 },
  sectionTitle: { color: '#211A29', fontFamily: FontFamily.bold, fontSize: 25, letterSpacing: -0.5 },
  toolGrid: { flexDirection: 'row', gap: 16 },
  toolGridCompact: { flexDirection: 'column' },
  toolCard: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBE7ED', borderRadius: 18, padding: 24, alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F2EAF9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  toolTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: '#211A29' },
  toolDescription: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 22, color: '#716B77', marginTop: 8 },
  toolLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  toolLinkText: { color: Theme.palette.primaryDark, fontFamily: FontFamily.bold, fontSize: 13 },
  tip: { marginTop: 24 },
  pressed: { opacity: 0.75 },
});
