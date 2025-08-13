import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Center, Icon, Image, Input, useToast, VStack } from 'native-base';
import api from '../services/api';
import { Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

const logo = require('../../assets/login.png');
 
export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <Center flex={1} px={4} bg="gray.50">
            <Box w="100%" maxW="300" alignItems="center">
                <Image source={logo} alt="Logo" size="xl" resizeMode="contain" />
            </Box>
            <Box w="100%" maxW="300" bg="white" p={6} borderRadius="lg" shadow={4}>
                <VStack space={4}>
                    <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <Input 
                        placeholder="Senha" 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChangeText={setPassword} 
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
                    <Button mt={2} onPress={handleLogin}>Entrar</Button>
                </VStack>
            </Box>
        </Center>
    );
}