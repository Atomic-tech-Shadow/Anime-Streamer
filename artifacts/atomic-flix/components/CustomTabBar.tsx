import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const SCREEN_W = Dimensions.get("window").width;
const TAB_BAR_W = SCREEN_W - 48;

interface TabItem {
  name: string;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: TabItem[] = [
  { name: "index",    label: "Accueil",  icon: "home",     iconActive: "home" },
  { name: "planning", label: "Planning", icon: "calendar", iconActive: "calendar" },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function TabIcon({ tab, isActive, colors }: { tab: TabItem; isActive: boolean; colors: any }) {
  const scale     = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const bounceY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.22,
          useNativeDriver: true,
          tension: 180,
          friction: 7,
        }),
        Animated.spring(bounceY, {
          toValue: -5,
          useNativeDriver: true,
          tension: 180,
          friction: 7,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
        Animated.spring(bounceY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  const color = isActive ? colors.neonPurple : colors.mutedForeground;

  return (
    <Animated.View style={[
      styles.iconWrapper,
      { transform: [{ scale }, { translateY: bounceY }] }
    ]}>
      {/* Glow ring behind icon */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            backgroundColor: colors.neonPurple + "30",
            opacity: glowAnim,
            shadowColor: colors.neonPurple,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
          },
        ]}
      />
      <Feather name={tab.icon as any} size={22} color={color} />
    </Animated.View>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabW = TAB_BAR_W / TABS.length;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: state.index * tabW,
      useNativeDriver: true,
      tension: 160,
      friction: 10,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[
        styles.pill,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.neonPurple,
          width: TAB_BAR_W,
        }
      ]}>
        {/* Sliding indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabW,
              backgroundColor: colors.neonPurple + "18",
              borderColor: colors.neonPurple + "55",
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {TABS.map((tab, i) => {
          const route = state.routes[i];
          if (!route) return null;
          const isActive = state.index === i;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.tab}
            >
              <TabIcon tab={tab} isActive={isActive} colors={colors} />
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.neonPurple : colors.mutedForeground,
                    fontWeight: isActive ? "700" : "500",
                    opacity: isActive ? 1 : 0.65,
                  },
                ]}
              >
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    height: 64,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
    }),
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  glowRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
