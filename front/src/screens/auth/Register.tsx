import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { Box, Button, Center, Icon, Image, Input, useToast, VStack, Text } from "native-base";
import api from "../../services/api";
import { Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { isStrongPassword } from "../../utils/validatePassword";
import logo from "../../../assets/login.png";

export default function Register() {
  const navigation = useNavigation();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.show({ title: "Campos obrigatórios", description: "Preencha todos os campos.", duration: 3000 });
      return;
    }

    if (password !== confirmPassword) {
      toast.show({ title: "Senha inválida", description: "As senhas não coincidem.", duration: 3000 });
      return;
    }

    if (!isStrongPassword(password)) {
      toast.show({ title: "Senha fraca", description: "Use senha forte com maiúscula, minúscula, número e símbolo.", duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: confirmPassword
      });

      toast.show({ title: "Cadastro realizado", description: "Conta criada com sucesso.", duration: 3000 });

      setName(""); setEmail(""); setPassword(""); setConfirmPassword("");

      navigation.navigate("Login" as never);
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.show({
        title: "Erro ao cadastrar",
        description: err.response?.data?.message || "Não foi possível criar a conta.",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Center flex={1} px={4} bg="gray.50">
          <Box w="100%" maxW="300" alignItems="center" mb={6}>
            <Image source={logo} alt="Logo" size="2xl" resizeMode="contain" />
          </Box>

          <Box w="100%" maxW="320" bg="white" p={6} borderRadius="lg" shadow={5}>
            <VStack space={4}>
              <Input placeholder="Nome completo" value={name} onChangeText={setName} />
              <Input placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              
              <Input
                placeholder="Senha"
                value={password}
                onChangeText={(v) => { setPassword(v); setPasswordValid(isStrongPassword(v)); }}
                secureTextEntry={!showPassword}
                textContentType="none"        
                autoComplete="off"            
                autoCorrect={false} 
                InputRightElement={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Icon as={showPassword ? EyeOff : Eye} size={5} mr={2} color="muted.400" />
                  </Pressable>
                }
              />
              {!passwordValid && (
                <Text color="red.500" fontSize="xs">
                  A senha deve conter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.
                </Text>
              )}

              <Input
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="none"        
                autoComplete="off"            
                autoCorrect={false} 
                InputRightElement={
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon as={showConfirmPassword ? EyeOff : Eye} size={5} mr={2} color="muted.400" />
                  </Pressable>
                }
              />

              <Button mt={2} onPress={handleRegister} isLoading={loading}>
                Cadastrar
              </Button>

              <Pressable onPress={() => navigation.navigate("Login" as never)}>
                <Text mt={2} color="blue.500" textAlign="center">Já tem conta? Faça login</Text>
              </Pressable>
            </VStack>
          </Box>
        </Center>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}