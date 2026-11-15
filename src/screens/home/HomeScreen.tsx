import { FitCheckLogo } from '@/src/components/branding/FitCheckLogo';
import { FontFamily, Theme } from '@/constants/theme';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { ArrowRight, Camera, ChevronRight, ImagePlus, Shirt, Sparkles } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
    background: Theme.colors.background.light,
    ink: '#23182F',
    secondary: '#62566D',
    purple: '#603496',
    tint: '#EEE4FA',
    border: '#E4D9ED',
    white: '#FFFFFF',
};

const tools = [
    { href: '/wardrobe', title: 'Wardrobe', detail: 'Manage clothes and build outfits', Icon: Shirt },
    { href: '/ai-stylist', title: 'AI Stylist', detail: 'Get outfit advice and pairings', Icon: Sparkles },
] as const;

export default function HomeScreen() {
    const { width, fontScale } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const showPhoto = Math.min(width, 600) / fontScale >= 340;

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <ScrollView
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={styles.content}
                alwaysBounceVertical={false}
            >
                <FitCheckLogo />

                <View style={styles.hero}>
                    <View style={styles.heroIntro}>
                        <View style={styles.heroCopy}>
                            <Text style={styles.eyebrow}>THE FIT CHECK</Text>
                            <Text accessibilityRole="header" style={styles.title}>Check your outfit</Text>
                            <Text style={styles.description}>Get feedback on what works and what you could change.</Text>
                        </View>
                        {showPhoto && (
                            <Image
                                source={require('@/assets/images/heromg.png')}
                                accessible={false}
                                contentFit="cover"
                                style={styles.photo}
                            />
                        )}
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityHint={isWeb ? 'Opens Fit Check' : 'Opens the camera for an outfit check'}
                            onPress={() => router.push({ pathname: '/fit-check', params: isWeb ? {} : { source: 'camera' } })}
                            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
                        >
                            {isWeb ? <Sparkles size={20} color={colors.white} /> : <Camera size={20} color={colors.white} />}
                            <Text style={[styles.buttonText, styles.primaryText]}>{isWeb ? 'Start a fit check' : 'Take a photo'}</Text>
                            <ArrowRight size={20} color={colors.white} />
                        </Pressable>
                        {!isWeb && (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityHint="Opens your photo library for an outfit check"
                                onPress={() => router.push({ pathname: '/fit-check', params: { source: 'gallery' } })}
                                style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
                            >
                                <ImagePlus size={20} color={colors.purple} />
                                <Text style={styles.buttonText}>Choose from library</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <View style={styles.tools}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>Your style tools</Text>
                    <View style={styles.toolGroup}>
                        {tools.map(({ href, title, detail, Icon }, index) => (
                            <Link href={href} key={href} asChild>
                                <Pressable
                                    accessibilityLabel={title}
                                    accessibilityHint={detail}
                                    style={index > 0 ? styles.toolDivider : undefined}
                                >
                                    {({ pressed }) => (
                                        <View style={[styles.tool, pressed && styles.pressed]}>
                                            <View style={styles.toolIcon}><Icon size={21} color={colors.purple} /></View>
                                            <View style={styles.toolCopy}>
                                                <Text style={styles.toolTitle}>{title}</Text>
                                                <Text style={styles.toolDetail}>{detail}</Text>
                                            </View>
                                            <ChevronRight size={18} color={colors.secondary} />
                                        </View>
                                    )}
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 24 },
    hero: { backgroundColor: colors.tint, borderRadius: 28, borderCurve: 'continuous', padding: 16, gap: 20 },
    heroIntro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroCopy: { flex: 1, paddingLeft: 4, gap: 6 },
    eyebrow: { fontFamily: FontFamily.bold, fontSize: 11, color: colors.purple, letterSpacing: 1.4 },
    title: { fontFamily: FontFamily.bold, fontSize: 36, letterSpacing: -1.4, color: colors.ink },
    description: { fontFamily: FontFamily.regular, fontSize: 15, color: colors.secondary, maxWidth: 230 },
    photo: { width: '35%', aspectRatio: 0.76, maxWidth: 152, borderRadius: 17, borderCurve: 'continuous', backgroundColor: '#CFAB85' },
    actions: { gap: 8 },
    button: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, borderCurve: 'continuous' },
    primary: { backgroundColor: colors.ink },
    primaryText: { color: colors.white },
    secondaryButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    buttonText: { flex: 1, fontFamily: FontFamily.bold, fontSize: 16, color: colors.purple },
    tools: { gap: 10 },
    sectionTitle: { fontFamily: FontFamily.bold, fontSize: 22, letterSpacing: -0.4, color: colors.ink },
    toolGroup: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
    tool: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
    toolDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    toolIcon: { width: 42, height: 42, borderRadius: 13, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint },
    toolCopy: { flex: 1, gap: 2 },
    toolTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: colors.ink },
    toolDetail: { fontFamily: FontFamily.regular, fontSize: 14, color: colors.secondary },
    pressed: { opacity: 0.72 },
});
