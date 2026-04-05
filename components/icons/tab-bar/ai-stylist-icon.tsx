import { Theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

export interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const AIStylistIcon = ({
  size = 24,
  color = Theme.colors.text.primary,
  style,
}: IconProps) => {
  return (
    <View style={style}>
      <MaterialCommunityIcons
        name="star-four-points"
        size={size}
        color={color}
      />
    </View>
  );
};
