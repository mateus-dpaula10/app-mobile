import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  Box,
  Button,
  Center,
  Icon,
  Image,
  Input,
  VStack,
  Text,
  useToast,
} from "native-base";
import { Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import logo from "../../../assets/login.png";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.show({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login", { email, password });
      const { user, access_token } = response.data;
      await login(user, access_token);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      toast.show({
        title: "Erro ao logar",
        description: "Credenciais inválidas.",
        duration: 3000,
        backgroundColor: "red.500",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Center flex={1} px={4} bg="gray.50">
          <Box w="100%" maxW="300" alignItems="center" mb={6}>
            <Image source={logo} alt="Logo" size="2xl" resizeMode="contain" />
          </Box>

          <Box w="100%" maxW="320" bg="white" p={6} borderRadius="lg" shadow={5}>
            <VStack space={4}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                InputRightElement={
                  <Icon
                    as={showPassword ? EyeOff : Eye}
                    size={5}
                    mr={2}
                    color="muted.400"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <Button mt={2} onPress={handleLogin} isLoading={loading}>
                Entrar
              </Button>

              <Text
                mt={2}
                color="blue.500"
                textAlign="center"
                onPress={() => navigation.navigate("Register" as never)}
              >
                Não tem conta? Cadastre-se
              </Text>
            </VStack>
          </Box>
        </Center>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}