import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Linking,
} from "react-native";

const GAP = 12;
const SIDE = 20; // matches HomeScreen horizontal padding
const CARD_W = Dimensions.get("window").width - SIDE * 2;

// MyGate-style sponsored banners. Images are hotlinked demo assets; the last
// one is an animated GIF to show motion. Swap `image`/`link` for real campaigns.
const ADS = [
  {
    id: "reebok",
    brand: "Reebok",
    title: "Up to 40% OFF",
    subtitle: "Running & training gear",
    cta: "Shop Now",
    color: "#E4002B",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&q=80",
    link: "https://www.reebok.com",
  },
  {
    id: "adidas",
    brand: "adidas",
    title: "New Arrivals",
    subtitle: "Impossible is Nothing",
    cta: "Explore",
    color: "#000000",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&q=80",
    link: "https://www.adidas.com",
  },
  {
    id: "cafe",
    brand: "Brew & Co. Cafe",
    title: "Buy 1 Get 1 Free",
    subtitle: "On all handcrafted coffees",
    cta: "Order Now",
    color: "#6F4E37",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
    link: "https://maps.google.com/?q=cafe+near+me",
  },
  {
    id: "food",
    brand: "FreshBite",
    title: "₹150 OFF first order",
    subtitle: "Groceries delivered in 15 min",
    cta: "Grab Deal",
    color: "#1BA672",
    image: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    link: "https://www.example.com",
  },
];

export default function AdsCarousel() {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  // Auto-advance the carousel every 3.5s, looping back to the start.
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ADS.length;
        listRef.current?.scrollToOffset({
          offset: next * (CARD_W + GAP),
          animated: true,
        });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / (CARD_W + GAP)));
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Sponsored</Text>
        <Text style={styles.adLabel}>Ad</Text>
      </View>

      <FlatList
        ref={listRef}
        data={ADS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => Linking.openURL(item.link).catch(() => {})}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.bg}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={styles.overlay} />
              <View style={styles.content}>
                <Text style={styles.brand}>{item.brand}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <View style={[styles.ctaBtn, { backgroundColor: item.color }]}>
                  <Text style={styles.ctaText}>{item.cta}</Text>
                </View>
              </View>
              <View style={styles.sponsoredTag}>
                <Text style={styles.sponsoredText}>Sponsored</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />

      <View style={styles.dots}>
        {ADS.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1B2B33" },
  adLabel: {
    fontSize: 10,
    color: "#8895A0",
    borderWidth: 1,
    borderColor: "#D6DEE3",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  card: { width: CARD_W, height: 150, marginRight: GAP },
  bg: { flex: 1, justifyContent: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
  },
  content: { padding: 18 },
  brand: { color: "#fff", fontSize: 13, fontWeight: "600", opacity: 0.9 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  subtitle: { color: "#EAF0F2", fontSize: 13, marginTop: 2 },
  ctaBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sponsoredTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sponsoredText: { color: "#fff", fontSize: 10 },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C7D2D8" },
  dotActive: { backgroundColor: "#0B6E8F", width: 18 },
});
