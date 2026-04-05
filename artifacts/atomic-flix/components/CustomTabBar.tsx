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
const TAB_BAR_W = SCREEN_W - 56;

interface TabItem {
  name: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { name: "planning", label: "Planning",   icon: "calendar" },
  { name: "index",    label: "Accueil",    icon: "home"     },
  { name: "history",  label: "Historique", icon: "clock"    },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function TabIcon({ tab, isActive, colors }: { tab: TabItem; isActive: boolean; colors: any }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.15 : 1,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
      }),
      Animated.spring(bounceY, {
        toValue: isActive ? -2 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
      }),
    ]).start();
  }, [isActive]);

  const color = isActive ? colors.neonPurple : colors.mutedForeground;

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY: bounceY }] }}>
      <Feather name={tab.icon as any} size={18} color={color} />
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[
        styles.pill,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.neonPurple,
          width: TAB_BAR_W,
        }
      ]}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabW,
              backgroundColor: colors.neonPurple + "15",
              borderColor: colors.neonPurple + "40",
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
            if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <TabIcon tab={tab} isActive={isActive} colors={colors} />
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.neonPurple : colors.mutedForeground,
                    fontWeight: isActive ? "700" : "500",
                    opacity: isActive ? 1 : 0.6,
                  },
                ]}
              >
                {tab.label}
              </Text>
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    height: 52,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 14 },
    }),
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
