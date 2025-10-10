import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, IconButton, Image, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { isStrongPassword } from '../../utils/validatePassword';
import { Ionicons } from '@expo/vector-icons';

type ImageFile = {
    uri: string;
    name: string;
    type: string;
    isNew?: boolean;
};

type Address = {
    id?: number;
    label: string;
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    number?: string;
    complement?: string;
    note?: string;
};
 
export default function ClientProfile() {
    const { user, refreshUser } = useAuth();
    const toast = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordValid, setPasswordValid] = useState(true);
    const [photo, setPhoto] = useState<ImageFile | null>(null);    

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [newAddress, setNewAddress] = useState<Address>({ 
        label: '',
        cep: '',
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        number: '',
        complement: '',
        note: ''
    });

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAddresses(user.addresses || []);
            if (user.photo) {
                setPhoto({
                    uri: `http://192.168.0.72:8000/storage/${user.photo}`,
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
                const destPath = `${(FileSystem as any).cacheDirectory}${fileName}`;
                await (FileSystem as any).copyAsync({ from: asset.uri, to: destPath });
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

    const fetchAddressByCep = async (cep: string) => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setNewAddress(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const addAddress = () => {
        if (!newAddress.label || !newAddress.cep || !newAddress.street) return;
        setAddresses(prev => [...prev, { ...newAddress }]);
        setNewAddress({ label: '', cep: '', street: '', neighborhood: '', city: '', state: '', number: '', complement: '', note: '' });
        toast.show({ title: 'Endereço adicionado', duration: 3000 });
    };

    const removeAddress = (index: number) => {
        setAddresses(prev => prev.filter((_, i) => i !== index));
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
        formData.append('name', name.trim());
        formData.append('email', email.trim());

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

        formData.append('addresses', JSON.stringify(addresses));

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
        <KeyboardAvoidingView
            style={{ flex: 1, padding: 16 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
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
            
            <Text bold mt={5}>Endereços de entrega</Text>
            {addresses.map((addr, index) => (
                <Box key={index} p={2} borderWidth={1} borderColor="gray.300" borderRadius="md" mb={2}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text bold>{addr.label}</Text>
                            <Text>{addr.street}, {addr.number} {addr.complement || ''} - {addr.neighborhood}, {addr.city} / {addr.state}</Text>
                        </VStack>
                        <IconButton icon={<Ionicons name="trash-outline" size={20} color="red" />} onPress={() => removeAddress(index)} />
                    </HStack>
                </Box>
            ))}

            <Input placeholder="Apelido do endereço" value={newAddress.label} onChangeText={v => setNewAddress(prev => ({ ...prev, label: v }))} />
            <Input placeholder="CEP" value={newAddress.cep} onChangeText={v => setNewAddress(prev => ({ ...prev, cep: v }))} onBlur={() => fetchAddressByCep(newAddress.cep)} />
            <Input placeholder="Rua" value={newAddress.street} isDisabled />
            <Input placeholder="Bairro" value={newAddress.neighborhood} isDisabled />
            <Input placeholder="Cidade" value={newAddress.city} isDisabled />
            <Input placeholder="Estado" value={newAddress.state} isDisabled />
            <Input placeholder="Número" value={newAddress.number} onChangeText={v => setNewAddress(prev => ({ ...prev, number: v }))} />
            <Input placeholder="Complemento" value={newAddress.complement} onChangeText={v => setNewAddress(prev => ({ ...prev, complement: v }))} />
            <Input placeholder="Observações" value={newAddress.note} onChangeText={v => setNewAddress(prev => ({ ...prev, note: v }))} />

            <Button mt={2} onPress={addAddress}>Adicionar endereço</Button>

            <Button mt={5} onPress={handleSave} isDisabled={!user}>
                Salvar perfil
            </Button>
        </KeyboardAvoidingView>
    );
}