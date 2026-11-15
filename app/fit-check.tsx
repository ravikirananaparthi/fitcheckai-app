import { Theme } from '@/constants/theme';
import AIStylistScreen from '@/src/screens/fitcheck/AIStylistScreen';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

export default function FitCheckRoute() {
    const { source } = useLocalSearchParams<{ source?: string }>();
    const initialSource = source === 'camera' || source === 'gallery' ? source : undefined;
    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Fit Check', headerBackButtonDisplayMode: 'minimal' }} />
            <ScrollView
                style={{ flex: 1, backgroundColor: Theme.colors.background.light }}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            >
                <AIStylistScreen embedded initialSource={initialSource} />
            </ScrollView>
        </>
    );
}
