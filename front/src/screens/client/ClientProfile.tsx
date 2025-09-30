import React, { useEffect, useState } from 'react';
import { Button, Image, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { isStrongPassword } from '../../utils/validatePassword';

type ImageFile = {
    uri: string;
    name: string;
    type: string;
    file?: File,
    isNew?: boolean
};
 
export default function ClientProfile() {
    const { user, refreshUser } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordValid, setPasswordValid] = useState(true);
    const [photo, setPhoto] = useState<ImageFile | null>(null);
    
    const toast = useToast();

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            if (user.photo) {
                setPhoto({
                    uri: `http://localhost:8000/storage/${user.photo}`,
                    name: 'profile.jpg',
                    type: 'image/jpeg',
                    isNew: false
                });
            }
        }
    }, [user]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            let uri = asset.uri;
            let name = asset.fileName || `profile_${Date.now()}.jpg`;
            let type = 'image/jpeg';

            if (Platform.OS !== 'web' && asset.uri.startsWith('content://')) {
                const fileName = asset.uri.split('/').pop();
                const destPath = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.copyAsync({ from: asset.uri, to: destPath });
                uri = destPath;
            }

            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            type = ext === 'png' ? 'image/png' : 'image/jpeg';

            setPhoto({
                uri,
                name,
                type,
                isNew: true
            });
        }
    };

    const handleSave = async () => {
        if (password && !passwordValid) {
            toast.show({
                title: 'Senha inválida',
                description: 'A senha deve conter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.',
                duration: 3000,
            });
            return;
        }

        if (password && password !== passwordConfirmation) {
            toast.show({
                title: 'Erro',
                description: 'As senhas não coincidem.',
                duration: 3000,
            });
            return;
        }

        const token = await AsyncStorage.getItem('@token');
        if (!token) return;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);

        if (password) {
            formData.append('password', password);
            formData.append('password_confirmation', passwordConfirmation);
        }

        if (photo?.isNew) {
            formData.append('photo', {
                uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
                name: photo.name,
                type: photo.type
            } as any);
        }

        try {
            const res = await api.put('/clients/updateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                }
            });

            await refreshUser();

            toast.show({
                title: 'Perfil atualizado com sucesso',
                duration: 3000,
                description: res.data.name,
            });
        } catch (err) {
            console.error(err);
            toast.show({
                title: 'Erro ao salvar perfil',
                duration: 3000
            });
        }
    };

    return (
        <LayoutWithSidebar>
            <VStack mt={10} space={3}>
                <Text bold fontSize="xl">Perfil do Cliente</Text>

                <Input placeholder="Nome" value={name} onChangeText={setName} />
                <Input placeholder="E-mail" value={email} onChangeText={setEmail} />
                <Input
                    placeholder="Nova senha"
                    value={password}
                    secureTextEntry
                    borderColor={
                        (password || '').length > 0 && !passwordValid ? 'red.500' : 'gray.300'
                    }
                    onChangeText={(v) => {
                        setPassword(v);
                        setPasswordValid(isStrongPassword(v));
                    }}
                />
                {(password || '').length > 0 && !passwordValid && (
                    <Text color="red.500" fontSize="xs">
                        A senha deve conter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.
                    </Text>
                )}
                <Input
                    placeholder="Confirme a nova senha"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry
                />

                <Button mt={2} onPress={pickImage}>
                    Selecionar foto de perfil
                </Button>
                {photo && <Image source={{ uri: photo.uri }} alt="Foto de perfil" size="md" mt={2} />}

                <Button mt={5} onPress={handleSave} isDisabled={!user}>
                    Salvar perfil
                </Button>
            </VStack>
        </LayoutWithSidebar>
    );
}