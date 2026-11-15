import { FitCheckLogo } from '@/src/components/branding/FitCheckLogo';
import { Theme } from '@/constants/theme';
import { House, Shirt, Sparkles, UserRound } from 'lucide-react-native';
import { usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MotionifyProvider } from 'react-native-motionify';

const tabs = [
  { name: 'index', href: '/', label: 'Home', Icon: House },
  { name: 'ai-stylist', href: '/ai-stylist', label: 'AI Stylist', Icon: Sparkles },
  { name: 'wardrobe', href: '/wardrobe', label: 'Wardrobe', Icon: Shirt },
  { name: 'profile', href: '/profile', label: 'Profile', Icon: UserRound },
] as const;

export default function WebTabLayout() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const compact = width < 760;

  return (
    <MotionifyProvider threshold={10} supportIdle={false}>
      <Tabs style={styles.root}>
        <TabSlot
          detachInactiveScreens
          style={[styles.tabSlot, compact ? styles.tabSlotCompact : styles.tabSlotWide]}
        />
        <TabList style={[styles.tabList, compact ? styles.tabListCompact : styles.tabListWide]}>
          {!compact && <View style={styles.brandBlock}><FitCheckLogo /></View>}
          {tabs.map((tab) => {
            const selected = pathname === tab.href;
            const color = selected ? Theme.palette.primaryDark : Theme.colors.text.secondary;
            const Icon = tab.Icon;

            return (
              <TabTrigger
                key={tab.name}
                name={tab.name}
                href={tab.href}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.tab,
                  compact ? styles.tabCompact : styles.tabWide,
                  selected && styles.tabSelected,
                  pressed && styles.tabPressed,
                ]}
              >
                <Icon color={color} size={20} strokeWidth={selected ? 2.5 : 2} />
                <Text style={[styles.tabLabel, compact && styles.tabLabelCompact, { color }]}>{tab.label}</Text>
              </TabTrigger>
            );
          })}
        </TabList>
      </Tabs>
    </MotionifyProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background.light },
  tabSlot: { flex: 1, backgroundColor: Theme.colors.background.light },
  tabSlotWide: { marginLeft: 240 },
  tabSlotCompact: { marginBottom: 70 },
  tabList: { position: 'absolute', backgroundColor: Theme.colors.background.surface.light },
  tabListWide: { top: 0, bottom: 0, left: 0, width: 240, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', paddingHorizontal: 18, paddingVertical: 32, gap: 8, borderRightWidth: 1, borderRightColor: '#E9E5ED' },
  tabListCompact: { right: 0, bottom: 0, left: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E9E5ED' },
  brandBlock: { marginBottom: 42, paddingHorizontal: 8 },
  tab: { alignItems: 'center', gap: 10, borderRadius: 12 },
  tabWide: { flexDirection: 'row', minHeight: 48, paddingHorizontal: 14 },
  tabCompact: { flex: 1, minHeight: 48, justifyContent: 'center' },
  tabSelected: { backgroundColor: '#F1E7FF' },
  tabPressed: { opacity: 0.72 },
  tabLabel: { fontFamily: 'GoogleSansFlex_600SemiBold', fontSize: 15 },
  tabLabelCompact: { fontSize: 11 },
});
