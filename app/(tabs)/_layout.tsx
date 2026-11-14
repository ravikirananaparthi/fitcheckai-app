import { Ionicons } from '@expo/vector-icons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MotionifyProvider } from 'react-native-motionify';

const brandColor = '#A855F7';

export default function TabLayout() {
  return (
    <MotionifyProvider threshold={10} supportIdle={false}>
      <NativeTabs tintColor={brandColor}>
        <NativeTabs.Trigger name="index">
          <Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="home-outline" />}
          />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="ai-stylist">
          <Icon
            sf="sparkles"
            androidSrc={<VectorIcon family={Ionicons} name="sparkles-outline" />}
          />
          <Label>AI Stylist</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="wardrobe">
          <Icon
            sf={{ default: 'tshirt', selected: 'tshirt.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="shirt-outline" />}
          />
          <Label>Wardrobe</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon
            sf={{ default: 'person', selected: 'person.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="person-outline" />}
          />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </MotionifyProvider>
  );
}
