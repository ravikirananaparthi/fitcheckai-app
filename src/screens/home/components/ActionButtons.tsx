import { Theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const LIME = Theme.palette.primary;
const DARK = Theme.palette.surface.dark;

export default function ActionButtons() {
  return (
    <View style={styles.actionRow}>
      <Pressable style={styles.btnDark} android_ripple={{ color: DARK }}>
        <Ionicons
          name="camera-outline"
          size={18}
          color={LIME}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.btnDarkText}>Take Photo</Text>
      </Pressable>
      <Pressable style={styles.btnLime} android_ripple={{ color: LIME }}>
        <Ionicons
          name="arrow-up-outline"
          size={18}
          color={DARK}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.btnLimeText}>Upload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
    marginTop: 16,
  },
  btnDark: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK,
    borderRadius: 50,
    paddingVertical: 14,
  },
  btnDarkText: {
    color: Theme.colors.textLight.inverse,
    fontSize: 15,
    fontWeight: "700",
  },
  btnLime: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIME,
    borderRadius: 50,
    paddingVertical: 14,
  },
  btnLimeText: {
    color: DARK,
    fontSize: 15,
    fontWeight: "700",
  },
});
