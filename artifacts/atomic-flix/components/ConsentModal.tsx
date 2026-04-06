import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONSENT_KEY = "@atomic_flix_consent_v2";
const PRIVACY_URL = "https://privacy-plolicy.zone.id/";
const TERMS_URL   = "https://privacy-plolicy.zone.id/terms";

export default function ConsentModal() {
  const [visible, setVisible]   = useState(false);
  const [checked, setChecked]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY).then((val) => {
      if (val !== "true") setVisible(true);
    });
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <View style={styles.card}>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Icône app + titre */}
              <View style={styles.header}>
                <Image
                  source={require("../assets/images/icon_preview.png")}
                  style={styles.appIcon}
                  contentFit="contain"
                />
                <Text style={styles.appName}>ATOMIC FLIX</Text>
                <Text style={styles.subtitle}>
                  Avant de continuer, merci de lire et accepter nos conditions.
                </Text>
              </View>

              {/* Bloc Politique de confidentialité */}
              <View style={styles.policyBox}>
                <Feather name="shield" size={16} color="#7c3aed" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.policyTitle}>Politique de confidentialité</Text>
                  <Text style={styles.policyDesc}>
                    Nous ne collectons aucune donnée personnelle.
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} activeOpacity={0.75}>
                    <Text style={styles.policyLink}>Lire la politique de confidentialité →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bloc Conditions d'utilisation */}
              <View style={[styles.policyBox, { borderColor: "rgba(59,130,246,0.25)", backgroundColor: "rgba(59,130,246,0.06)" }]}>
                <Feather name="file-text" size={16} color="#3b82f6" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.policyTitle}>Conditions d'utilisation</Text>
                  <Text style={styles.policyDesc}>
                    L'application est fournie à titre personnel et non commercial. Tout usage abusif est interdit.
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} activeOpacity={0.75}>
                    <Text style={[styles.policyLink, { color: "#3b82f6" }]}>Lire les conditions d'utilisation →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Checkbox unique */}
              <TouchableOpacity style={styles.checkRow} onPress={() => setChecked((v) => !v)} activeOpacity={0.8}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkLabel}>
                  J'ai lu et j'accepte la politique de confidentialité et les conditions d'utilisation
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Bouton Continuer */}
            <TouchableOpacity
              onPress={handleAccept}
              disabled={!checked}
              activeOpacity={0.85}
              style={{ marginTop: 6 }}
            >
              <LinearGradient
                colors={checked ? ["#7c3aed", "#3b82f6"] : ["#1e1e2e", "#1e1e2e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.continueBtn, !checked && styles.continueBtnDisabled]}
              >
                <Text style={[styles.continueBtnText, !checked && { color: "#444" }]}>
                  Continuer
                </Text>
                <Feather name="arrow-right" size={16} color={checked ? "#fff" : "#444"} />
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  safeArea: { width: "100%" },
  card: {
    backgroundColor: "#0f0f1a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
    maxHeight: "90%",
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  appName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  policyBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(124,58,237,0.07)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  policyTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  policyDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 7,
  },
  policyLink: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "600",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  checkLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 2,
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
