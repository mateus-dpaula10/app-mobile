import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Center, Image, Input, useToast, VStack } from 'native-base';
import api from '../services/api';

const logo = require('../../assets/favicon.png');
 
export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const toast = useToast();

    const handleLogin = async () => {
        try {
            const response = await api.post('/login', {
                email,
                password
            });
            
            const { user, access_token } = response.data;
            
            login(user, access_token);
        } catch (error: any) {
            console.error(error.response?.data);
            toast.show({
                title: 'Erro ao logar',
                description: 'Credenciais inválidas.',
                duration: 3000
            });
        }
    };

    return (
        <Center flex={1} px={4}>
            <Box w="100%" maxW="300" alignItems="center" mb={8}>
                <Image source={logo} alt="Logo" size="xl" resizeMode="contain" />
            </Box>
            <Box w="100%" maxW="300">
                <VStack space={4}>
                    <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <Input placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
                    <Button onPress={handleLogin}>Entrar</Button>
                </VStack>
            </Box>
        </Center>
    );
}