import { Theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const LIME = Theme.palette.primary;
const DARK = Theme.palette.surface.dark;
const TEXT = Theme.colors.text.inverse;

const BORDER_WIDTH = 4;

export default function HeroSection() {
  const { width } = useWindowDimensions();
  const circleSize = Math.min(Math.max(width - 48, 280), 520);

  return (
    <View style={styles.heroSection}>
      {/* Title — centered */}
      <Text style={styles.heroTitle}>Your Style,</Text>
      <View style={styles.heroHighlightRow}>
        <View style={styles.heroHighlightPill}>
          <Text style={styles.heroHighlightText}>Elevated.</Text>
        </View>
      </View>
      <Text style={styles.heroSubtitle}>
        Let AI curate your perfect look today.
      </Text>

      {/* Circular CTA Image */}
      <View style={styles.circleContainer}>
        <View style={[styles.circleBorder, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
          {/* Outfit photo */}
          <Image
            source={require("@/assets/images/heromg.png")}
            style={styles.circleImage}
            resizeMode="cover"
          />

          {/* Blurred overlay — covers center/bottom area */}
          <View style={styles.overlayWrapper}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={40} tint="dark" style={styles.blurFill} />
            ) : (
              <View style={styles.androidBlurFallback} />
            )}

            {/* Content on top of blur */}
            <View style={styles.overlayContent}>
              {/* NEW badge */}
              <View style={styles.newBadge}>
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={11}
                  color={DARK}
                />
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>

              {/* CTA text */}
              <Text style={styles.ctaTitle}>GET A FITCHECK</Text>
              <Text style={styles.ctaSubtitle}>
                Instant AI analysis for your{"\n"}outfit with tips.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },

  // ── Title (centered) ─────────────────────────────────────────────────────
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: TEXT,
    lineHeight: 40,
    textAlign: "center",
  },
  heroHighlightRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  heroHighlightPill: {
    backgroundColor: LIME,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  heroHighlightText: {
    fontSize: 34,
    fontWeight: "800",
    color: DARK,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },

  // ── Circle ───────────────────────────────────────────────────────────────
  circleContainer: {
    alignSelf: "center",
  },
  circleBorder: {
    borderWidth: BORDER_WIDTH,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: "#C8A882",
  },
  circleImage: {
    width: "100%",
    height: "100%",
  },

  // ── Blurred Overlay ──────────────────────────────────────────────────────
  overlayWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%", // covers center-to-bottom
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBlurFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    paddingHorizontal: 20,
  },

  // ── NEW Badge ────────────────────────────────────────────────────────────
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIME,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
    gap: 5,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: DARK,
    letterSpacing: 0.5,
  },

  // ── CTA ──────────────────────────────────────────────────────────────────
  ctaTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    width: "100%",
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    width: "100%",
  },
});
