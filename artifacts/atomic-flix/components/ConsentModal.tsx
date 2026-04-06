import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONSENT_KEY = "@atomic_flix_consent_accepted";
const PRIVACY_URL = "https://privacy-plolicy.zone.id/";

export default function ConsentModal() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

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

            {/* Logo / titre */}
            <View style={styles.header}>
              <LinearGradient
                colors={["#7c3aed", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrap}
              >
                <Feather name="play" size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.appName}>ATOMIC FLIX</Text>
              <Text style={styles.subtitle}>
                Avant de continuer, merci de lire et accepter nos conditions.
              </Text>
            </View>

            {/* Bloc Privacy Policy */}
            <View style={styles.policyBox}>
              <Feather name="shield" size={16} color="#7c3aed" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>Politique de confidentialité</Text>
                <Text style={styles.policyDesc}>
                  Nous collectons uniquement les données nécessaires au bon fonctionnement de l'application.
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(PRIVACY_URL)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.policyLink}>Lire la politique de confidentialité →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setChecked((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Text style={styles.checkLabel}>
                J'ai lu et j'accepte la politique de confidentialité
              </Text>
            </TouchableOpacity>

            {/* Bouton Continuer */}
            <TouchableOpacity
              onPress={handleAccept}
              disabled={!checked}
              activeOpacity={0.85}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={checked ? ["#7c3aed", "#3b82f6"] : ["#2a2a3a", "#2a2a3a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.continueBtn, !checked && styles.continueBtnDisabled]}
              >
                <Text style={[styles.continueBtnText, !checked && { color: "#555" }]}>
                  Continuer
                </Text>
                <Feather name="arrow-right" size={16} color={checked ? "#fff" : "#555"} />
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
    padding: 24,
    paddingBottom: 20,
    gap: 18,
    borderTopWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
  },
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  policyBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  policyTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  policyDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  policyLink: {
    color: "#7c3aed",
    fontSize: 13,
    fontWeight: "600",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
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
    color: "rgba(255,255,255,0.75)",
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
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
