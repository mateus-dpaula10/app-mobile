import React, { useEffect, useState } from 'react';
import { Box, Button, Image, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { Product } from '../../type/Product';
import * as ImagePicker from 'expo-image-picker';
import { FlatList, Platform, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

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

export default function StoreProducts() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const toast = useToast();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
            base64: Platform.OS === 'web' ? true : false
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            
            if (Platform.OS === 'web' && asset.base64) {
                const mimeType = asset.uri?.startsWith('data:') 
                    ? asset.uri.split(';')[0].replace('data:', '') 
                    : 'image/jpeg';
                const blob = base64toBlob(asset.base64, mimeType);
                const file = new File([blob], asset.fileName || `photo_${Date.now()}.jpg`, { type: mimeType });

                setImages((prev) => [
                    ...prev,
                    {
                        uri: URL.createObjectURL(blob),
                        name: file.name,
                        type: file.type,
                        file
                    },
                ]);
            } else {
                let localUri = asset.uri;
                if (Platform.OS !== 'web' && asset.uri.startsWith('content://')) {                
                    const fileName = asset.uri.split('/').pop();
                    const destPath = `${FileSystem.cacheDirectory}${fileName}`;
                    await FileSystem.copyAsync({ from: asset.uri, to: destPath });
                    localUri = destPath;
                }

                const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
                let mimeType = 'image/jpeg';
                if (ext === 'png') mimeType = 'image/png';

                setImages((prev) => [
                    ...prev,
                    {
                        uri: localUri,
                        name: asset.fileName || `photo_${Date.now()}.${ext}`,
                        type: mimeType,
                    }
                ]);
            }
        }
    };

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

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

        if (existingImages.length > 0) {
            existingImages.forEach(path => {
                formData.append('existing_images[]', path);
            });
        }

        images.forEach((image) => {
            if (Platform.OS === 'web' && image.file) {
                formData.append('images[]', image.file, image.name);
            } else {
                formData.append('images[]', {
                    uri: image.uri,
                    name: image.name,
                    type: image.type
                } as any);
            }
        });

        setSaving(true);

        try {
            if (editingId) {
                const response = await api.post(`/products/${editingId}?_method=PUT`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });

                setProducts((prev) =>
                    prev.map((p) => (p.id === editingId ? response.data : p))
                );

                toast.show({
                    title: 'Produto atualizado',
                    description: 'O produto foi atualizado',
                    duration: 3000
                });
            } else {
                const response = await api.post('/products', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    },
                });

                setProducts((prev) => [...prev, response.data]);

                toast.show({
                    title: 'Produto criado',
                    description: 'O produto foi criado',
                    duration: 3000
                });
            }

            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setImages([]);
            setExistingImages([]);
            setEditingId(null);
        } catch (err: any) {
            console.error(err);
            
            if (err.response?.data?.errors) {
                const mensagens = Object.values(err.response.data.errors)
                    .flat()
                    .join('\n');

                toast.show({
                    title: 'Erro de validação',
                    description: mensagens,
                    duration: 5000
                });
            } else {
                toast.show({
                    title: 'Erro ao cadastrar',
                    description: 'O produto não foi cadastrado',
                    duration: 3000
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setDescription(product.description);
        setPrice(String(product.price));
        setStock(String(product.stock_quantity));

        setExistingImages(product.images.map(img => img.image_path));

        setImages([]);
    };

    const handleDeleteProduct = async (id: number) => {
        const token = await AsyncStorage.getItem('@token');

        try {
            await api.delete(`/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts((prev) => prev.filter((p) => p.id !== id));
            toast.show({
                title: 'Produto excluído',
                description: 'O produto foi excluído',
                duration: 3000
            });
        } catch (err) {
            console.error(err);
            toast.show({
                title: 'Erro ao excluir',
                description: 'O produto não foi excluído',
                duration: 3000
            });
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const getImageUrl = (path: string) => {
        return `http://localhost:8000/storage/${path}`
    };

    const { width } = useWindowDimensions();
    const numColumns = width < 500 ? 1 : width < 900 ? 2 : 3;

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
                {existingImages.map((imgPath, index) => (
                    <Box key={`old-${index}`} position="relative" mt={2}>
                        <Image
                            source={{ uri: getImageUrl(imgPath) }}
                            style={{ width: 100, height: 100 }}
                            alt={`Imagem existente ${index + 1}`}
                        />
                        <Button
                            size="xs"
                            position="absolute"
                            top={0}
                            right={0}
                            onPress={() => {
                                setExistingImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            colorScheme="red"
                        >
                            X
                        </Button>
                    </Box>
                ))}
                {images.map((img, index) => (
                    <Box key={`new-${index}`} position="relative" mt={2}>
                        <Image
                            source={{ uri: img.uri }}
                            style={{ width: 100, height: 100 }}
                            alt={`Imagem nova ${index + 1}`}
                        />
                        <Button
                            size="xs"
                            position="absolute"
                            top={0}
                            right={0}
                            onPress={() => {
                                setImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            colorScheme="red"
                        >
                            X
                        </Button>
                    </Box>
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
                        numColumns={numColumns}
                        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <Box 
                                borderBottomWidth={1} 
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3} 
                                m={2}
                                flex={1}
                            >
                                {item.images && item.images.length > 0 ? (
                                    <Image
                                        source={{ uri: getImageUrl(item.images[0].image_path) }}
                                        style={{ width: 100, height: 100, marginTop: 8 }}
                                        alt="Imagem do produto"
                                    />
                                ) : (
                                    <Text>Sem imagem</Text>
                                )}
                                <Text bold mt={2}>{item.name}</Text>
                                <Text fontSize="sm">{item.description}</Text>
                                <Text>Preço: R$ {Number(item.price).toFixed(2).replace('.', ',')}</Text>
                                <Text>Estoque: {item.stock_quantity}</Text>

                                <Box flexDirection="row" mt={2}>
                                    <Button
                                        size="sm"
                                        colorScheme="blue"
                                        mr={2}
                                        onPress={() => handleEditProduct(item)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme="red"
                                        onPress={() => handleDeleteProduct(item.id)}>
                                        Excluir
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    />
                )}
            </VStack>
        </LayoutWithSidebar>
    );
}