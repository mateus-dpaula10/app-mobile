import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function StoreDashboard() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Dashboard Store</Text>
      <Button title="Sair" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, marginBottom: 20 },
});