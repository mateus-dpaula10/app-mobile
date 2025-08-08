import React, { useEffect, useState } from 'react';
import { Box, Button, Image, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { Product } from '../../type/Product';
import * as ImagePicker from 'expo-image-picker';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ImageFile = {
    uri: string;
    name: string;
    type: string;
};
 
export default function StoreProducts() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<ImageFile[]>([]);
    const toast = useToast();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            setImages(prev => [
                ...prev,
                {
                    uri: asset.uri,
                    name: asset.fileName ?? `image_${Date.now()}.jpg`,
                    type: asset.type ? `${asset.type}/${getFileExtension(asset.uri)}` : 'image/jpeg'
                },
            ]);
        }
    };

    function getFileExtension(uri: string) {
        const match = /\.(\w+)$/.exec(uri);
        return match ? match[1] : 'jpeg';
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Erro ao carregar produtos', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        const token = await AsyncStorage.getItem('@token');
        if (!token) {
            console.error('Token não encontrado');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stock_quantity', stock);

        images.forEach((image, index) => {            
            formData.append(`images[]`, {
                uri: image.uri,
                name: image.name,
                type: image.type
            } as any);
        });

        setSaving(true);
        
        try {
            const response = await api.post('/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            setProducts((prev) => [...prev, response.data]);
            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setImages([]);
        } catch (err) {
            console.error(err);
            toast.show({
                title: 'Erro ao cadastrar',
                description: 'O produto não foi cadastrado',
                duration: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold>Cadastro de produto</Text>

                <Input 
                    placeholder="Nome do produto"
                    value={name}
                    onChangeText={setName}
                    mt={2}
                />  
                <Input 
                    placeholder="Descrição"
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    mt={1}
                />  
                <Input 
                    placeholder="Preço"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice} 
                    mt={1}
                />  
                <Input 
                    placeholder="Estoque"
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                    mt={1}
                />  
                <Button 
                    onPress={pickImage}
                    mt={2}
                >
                    Selecionar imagem
                </Button>
                {images.map((img, index) => (
                    <Image
                        key={index}
                        source={{ uri: img.uri }}
                        style={{ width: 100, height: 100, marginTop: 10 }}
                        alt={`Imagem ${index + 1}`}
                    />
                ))}
                <Button
                    onPress={handleAddProduct}
                    isLoading={saving}
                    mt={2}
                >
                    Salvar produto
                </Button>

                {loading ? (
                    <Text mt={10}>Carregando produtos...</Text>
                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <Box borderBottomWidth={1} borderColor="gray.200" p={3} mt={4}>
                                <Text bold>{item.name}</Text>
                                <Text>{item.description}</Text>
                                <Text>Preço: R$ {Number(item.price).toFixed(2)}</Text>
                                <Text>Estoque: {item.stock_quantity}</Text>

                                {item.images && item.images.length > 0 && (
                                    <Image
                                        source={{ uri: item.images[0].image_path }}
                                        style={{ width: 100, height: 100, marginTop: 8 }}
                                        alt="Imagem do produto"
                                    />
                                )}
                            </Box>
                        )}
                    />
                )}
            </VStack>
        </LayoutWithSidebar>
    );
}