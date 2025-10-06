import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();

  function handleLogin() {
    login(
      { id: 1, name: "João", email: "joao@test.com", role: "client" },
      "fake-token-123"
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔑 Tela de Login</Text>
      <Button title="Entrar como Cliente" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, marginBottom: 20 },
});
