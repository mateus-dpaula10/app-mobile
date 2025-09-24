import { Button, Image, Input, Select, Text, useToast, VStack } from 'native-base';
import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const base64toBlob = (base64: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
};

type ImageFile = {
    uri: string;
    name: string;
    type: string;
    file?: File
};

export default function StoreProfile() {
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<string>('active');
    const [deliveryFee, setDeliveryFee] = useState('');
    const [deliveryRadius, setDeliveryRadius] = useState('');
    const [logo, setLogo] = useState<ImageFile | null>(null);

    const categories = [
        'Supermercado',
        'Padaria',
        'Restaurante',
        'Bebidas',
        'Doces e Sobremesas',
        'Farmácia',
        'Pet Shop',
        'Moda e Acessórios',
        'Eletrônicos',
        'Casa e Decoração',
        'Saúde e Beleza',
        'Esporte e Lazer',
        'Livraria'
    ];

    useEffect(() => {
        const loadCompany = async () => {
            const token = await AsyncStorage.getItem('@token');
            if (!token) return;

            try {
                const res = await api.get('/companies/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const company = res.data;

                setName(company.final_name || '');
                setCnpj(company.cnpj || '');
                setPhone(company.phone || '');
                setEmail(company.email || '');
                setAddress(company.address || '');
                if (company.category && categories.includes(company.categories)) {
                    setCategory(company.category);
                } else {
                    setCategory('');
                }
                setStatus(company.status || 'active');
                setDeliveryFee(company.delivery_fee || '');
                setDeliveryRadius(company.delivery_radius || '');

                if (company.logo) {
                    setLogo({
                        uri: `http://localhost:8000/storage/${company.logo}`,
                        name: 'logo.jpg',
                        type: 'image/jpeg',
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadCompany();
    }, []);

    const toast = useToast();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
            base64: Platform.OS === 'web' ? true : false,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            let uri = asset.uri;
            let name = asset.fileName || `logo_${Date.now()}.jpg`;
            let type = 'image/jpeg';

            if (Platform.OS === 'web' && asset.base64) {
                const mimeType = asset.uri?.startsWith('data:')
                    ? asset.uri.split(';')[0].replace('data:', '')
                    : 'image/jpeg';
                const blob = base64toBlob(asset.base64, mimeType);
                const file = new File([blob], name, { type: mimeType });
                uri = URL.createObjectURL(blob);
                type = mimeType;

                setLogo({
                    uri,
                    name: file.name,
                    type: file.type,
                    file,
                });
            } else {
                if (Platform.OS !== 'web' && asset.uri.startsWith('content://')) {
                    const fileName = asset.uri.split('/').pop();
                    const destPath = `${FileSystem.cacheDirectory}${fileName}`;
                    await FileSystem.copyAsync({ from: asset.uri, to: destPath });
                    uri = destPath;
                }

                const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
                type = ext === 'png' ? 'image/png' : 'image/jpeg';

                setLogo({
                    uri,
                    name,
                    type,
                });
            }
        }
    };

    const handleSave = async () => {
        const token = await AsyncStorage.getItem('@token');
        if (!token) return;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('cnpj', cnpj);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('address', address);
        formData.append('category', category);
        formData.append('status', status);
        formData.append('delivery_fee', deliveryFee);
        formData.append('delivery_radius', deliveryRadius);

        if (logo && (logo.file || logo.uri)) {
            if (Platform.OS === 'web' && logo.file) {
                formData.append('logo', logo.file, logo.name);
            } else {
                formData.append('logo', {
                    uri: logo.uri,
                    name: logo.name,
                    type: logo.type,
                } as any);
            }
        }

        try {
            const res = await api.post('/companies/addInfo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });
            toast.show({ title: 'Loja salva com sucesso', duration: 3000, description: res.data.name });
        } catch (err) {
            console.error(err);
            toast.show({ title: 'Erro ao salvar loja', duration: 3000 });
        }
    }

    return (
        <LayoutWithSidebar>
            <VStack mt={10} space={3}>
                <Text bold fontSize="lg">Perfil da Loja</Text>

                <Input placeholder="Nome da loja" value={name} onChangeText={setName} />
                <Input placeholder="CNPJ" value={cnpj} onChangeText={setCnpj} />
                <Input placeholder="Telefone" value={phone} onChangeText={setPhone} />
                <Input placeholder="E-mail" value={phone} onChangeText={setPhone} />
                <Input placeholder="Endereço" value={address} onChangeText={setAddress} />
                <Select
                    selectedValue={category}
                    minWidth={200}
                    placeholder="Selecione a categoria principal"
                    mt={1}
                    onValueChange={(value) => setCategory(value)}
                >
                    {categories.map((cat, i) => (
                        <Select.Item key={i} label={cat} value={cat} />
                    ))}
                </Select>

                <Text>Status</Text>
                <Select selectedValue={status} onValueChange={setStatus}>
                    <Select.Item label="Ativa" value="active" />
                    <Select.Item label="Pausada" value="suspended" />
                </Select>

                <Input placeholder="Taxa de entrega (R$)" value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="numeric" />
                <Input placeholder="Raio de entrega (km)" value={deliveryRadius} onChangeText={setDeliveryRadius} keyboardType="numeric" />

                <Button mt={2} onPress={pickImage}>Selecionar logo</Button>
                {logo && <Image source={{ uri: logo.uri }} alt="Logo" size="md" mt={2} />}

                <Button mt={5} onPress={handleSave}>Salvar loja</Button>
            </VStack>
        </LayoutWithSidebar>
    );
}