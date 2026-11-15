import { FontFamily } from '@/constants/theme';
import { ScanLine } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function FitCheckLogo() {
    return (
        <View style={styles.logo}>
            <View style={styles.mark} aria-hidden>
                <ScanLine size={19} color="#FFFFFF" />
            </View>
            <Text style={styles.wordmark}>FitCheck AI</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mark: { width: 34, height: 34, borderRadius: 11, borderCurve: 'continuous', backgroundColor: '#23182F', alignItems: 'center', justifyContent: 'center' },
    wordmark: { flexShrink: 1, fontFamily: FontFamily.bold, fontSize: 19, color: '#23182F' },
});
