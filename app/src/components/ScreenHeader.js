import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Consistent gradient page header used across the inner screens. Matches the
// Home hero styling: teal gradient, rounded bottom, icon chip + title/subtitle,
// a faint watermark icon, an optional right-aligned slot (e.g. a stat), and an
// optional back button (pass onBack to show it).
export default function ScreenHeader({ icon, title, subtitle, right, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={["#0E85AC", "#0B6E8F", "#075064"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 18 }]}
    >
      <Ionicons name={icon} size={130} color="rgba(255,255,255,0.10)" style={styles.watermark} />
      {!!onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}
      <View style={styles.row}>
        <View style={styles.iconChip}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  watermark: { position: "absolute", right: -14, top: 4 },
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 12, marginLeft: -4 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "700", marginLeft: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: { color: "#CDE9F2", fontSize: 13, marginTop: 2 },
});
