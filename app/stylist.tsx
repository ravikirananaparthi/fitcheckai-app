import StylistChatScreen from '@/src/screens/stylist/StylistChatScreen';
import { useLocalSearchParams } from 'expo-router';

export default function FitCheckStylistRoute() {
    const { fitCheckId } = useLocalSearchParams<{ fitCheckId?: string }>();
    return <StylistChatScreen key={fitCheckId} fitCheckId={fitCheckId} standalone />;
}
