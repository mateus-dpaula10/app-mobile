import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Center, Icon, Image, Input, Text, useToast, VStack } from 'native-base';
import api from '../services/api';
import { Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { isStrongPassword } from '../utils/validatePassword';
import { useNavigation } from '@react-navigation/native';

const logo = require('../../assets/login.png');
 
export default function RegisterScreen() {
    const toast = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordValid, setPasswordValid] = useState(true);
    const navigation = useNavigation();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            toast.show({
                title: 'Campos obrigatórios',
                description: 'Preencha todos os campos.',
                duration: 3000,
            });
            return;
        }

        if (password !== confirmPassword) {
            toast.show({
                title: 'Senha inválida',
                description: 'As senhas não coincidem.',
                duration: 3000,
            });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/register', {
                name,
                email,
                password,
                password_confirmation: confirmPassword
            });

            toast.show({
                title: 'Cadastro realizado',
                description: 'Conta criada com sucesso.',
                duration: 3000,
            });

            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');

            navigation.navigate('Login' as never);
        } catch (error: any) {
            console.error(error.response?.data);
            toast.show({
                title: 'Erro ao cadastrar',
                description: error.response?.data?.message || 'Não foi possível criar a conta.',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Center flex={1} px={4} bg="gray.50">
            <Box w="100%" maxW="300" alignItems="center">
                <Image source={logo} alt="Logo" size="xl" resizeMode="contain" />
            </Box>
            <Box w="100%" maxW="300" bg="white" p={6} borderRadius="lg" shadow={4}>
                <VStack space={4}>
                    <Input 
                        placeholder="Nome completo"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input 
                        placeholder="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Input 
                        placeholder="Senha" 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChangeText={v => {
                            setPassword(v);
                            setPasswordValid(isStrongPassword(v))
                        }} 
                        InputRightElement={
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                <Icon
                                    as={showPassword ? EyeOff : Eye}
                                    size={5}
                                    mr={2}
                                    color="muted.400"
                                />
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
                        type={showPassword ? 'text' : 'password'} 
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                        InputRightElement={
                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Icon
                                    as={showPassword ? EyeOff : Eye}
                                    size={5}
                                    mr={2}
                                    color="muted.400"
                                />
                            </Pressable>
                        } 
                    />
                    <Button mt={2} onPress={handleRegister} isLoading={loading}>Cadastrar</Button>
                </VStack>
            </Box>
        </Center>
    );
}