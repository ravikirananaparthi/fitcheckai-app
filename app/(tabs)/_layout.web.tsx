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
          {!compact && <View style={styles.brandBlock}><View style={styles.brandMark}><Text style={styles.brandMarkText}>F</Text></View><View><Text style={styles.brand}>FITCHECK</Text><Text style={styles.brandSub}>YOUR STYLE, REIMAGINED</Text></View></View>}
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
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42, paddingHorizontal: 8 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#29202F', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFF', fontFamily: 'GoogleSansFlex_700Bold', fontSize: 20 },
  brand: { color: '#211A29', fontFamily: 'GoogleSansFlex_700Bold', fontSize: 15, letterSpacing: 1 },
  brandSub: { color: '#99909D', fontFamily: 'GoogleSansFlex_600SemiBold', fontSize: 8, letterSpacing: 0.8, marginTop: 2 },
  tab: { alignItems: 'center', gap: 10, borderRadius: 12 },
  tabWide: { flexDirection: 'row', minHeight: 48, paddingHorizontal: 14 },
  tabCompact: { flex: 1, minHeight: 48, justifyContent: 'center' },
  tabSelected: { backgroundColor: '#F1E7FF' },
  tabPressed: { opacity: 0.72 },
  tabLabel: { fontFamily: 'GoogleSansFlex_600SemiBold', fontSize: 15 },
  tabLabelCompact: { fontSize: 11 },
});
