import {
  AIStylistIcon,
  AIStylistIconUF,
  HomeIcon,
  HomeIconUF,
  MenuIcon,
  MenuIconUF,
  WardrobeIcon,
  WardrobeIconUF,
} from "@/components/icons/tab-bar";
import { Theme } from "@/constants/theme";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_MARGIN = 40;
const TAB_BAR_HEIGHT = 62;
const TAB_COUNT = 4;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;

const TAB_ITEM_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const INDICATOR_SIZE = 50;
const INDICATOR_PADDING = (TAB_ITEM_WIDTH - INDICATOR_SIZE) / 2;

const SPRING_CONFIG = {
  damping: 25,
  stiffness: 250,
  mass: 0.8,
};

// Route names must exactly match the Tabs.Screen `name` props in _layout.tsx
const TAB_ICONS: Record<
  string,
  { filled: React.FC<any>; unfilled: React.FC<any> }
> = {
  index: { filled: HomeIcon, unfilled: HomeIconUF },
  "ai-stylist": { filled: AIStylistIcon, unfilled: AIStylistIconUF },
  wardrobe: { filled: WardrobeIcon, unfilled: WardrobeIconUF },
  profile: { filled: MenuIcon, unfilled: MenuIconUF },
};

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
}

const TabItem = memo(function TabItem({
  routeName,
  isFocused,
  onPress,
  onLongPress,
  label,
}: TabItemProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const iconConfig = TAB_ICONS[routeName];
  if (!iconConfig) return null;

  const IconComponent = isFocused ? iconConfig.filled : iconConfig.unfilled;
  const iconColor = "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <IconComponent size={24} color={iconColor} />
    </Pressable>
  );
});

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  onHomeDoubleTap,
}: BottomTabBarProps & { onHomeDoubleTap?: () => void }) {
  const insets = useSafeAreaInsets();

  const indicatorPosition = useSharedValue(
    state.index * TAB_ITEM_WIDTH + INDICATOR_PADDING
  );

  useEffect(() => {
    indicatorPosition.value = withSpring(
      state.index * TAB_ITEM_WIDTH + INDICATOR_PADDING,
      SPRING_CONFIG
    );
  }, [state.index, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  const tabBarBackground = Theme.colors.background.surface.dark;
  const indicatorColor = Theme.palette.primary;

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <View
        style={[styles.tabBarWrapper, { backgroundColor: tabBarBackground }]}
      >
        {/* Sliding Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            { backgroundColor: indicatorColor },
          ]}
        />

        {/* Tab Items */}
        <View style={styles.tabBarContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? String(options.tabBarLabel)
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              } else if (
                isFocused &&
                route.name === "index" &&
                onHomeDoubleTap
              ) {
                onHomeDoubleTap();
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                label={label}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: TAB_BAR_MARGIN,
    backgroundColor: "transparent",
    alignItems: "center",
    width: "100%",
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  indicator: {
    position: "absolute",
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2,
    left: 0,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
  },
});
