import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, HStack, Input, Spinner, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProductImage = {
  id: number;
  product_id: number;
  image_path: string;
}

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  company_id: number;
  images: ProductImage[];
}

type Store = {
    id: number;
    legal_name: string;
    cnpj: string;
    phone: string;
    address: string;
    plan: string;
    active: boolean;
    products: Product[];
}
 
export default function CustomerStores() {
    const [search, setSearch] = useState('');
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/companies-with-products');
                setStores(response.data);
            } catch (err) {
                console.error(err);
                toast.show({
                    title: 'Erro',
                    description: 'Não foi possível carregar as lojas',
                    duration: 3000,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const filteredStores = stores
        .map(store => {
            const products = store.legal_name.toLowerCase().includes(search.toLowerCase())
                ? store.products
                : store.products.filter(p => 
                    p.name.toLowerCase().includes(search.toLowerCase())
                );

            return {
                ...store,
                products
            };
        })
        .filter(store => store.products.length > 0);

    const toggleProduct = (product: Product) => {
        setSelectedProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
            if (exists) return prev.filter(p => p.id !== product.id);
            return [...prev, product];
        });
    };

    const addToCart = async () => {
        if (!selectedProducts.length) {
            toast.show({ title: 'Selecione produtos', duration: 2000 });
            return;
        }

        try {
            const token = await AsyncStorage.getItem('@token');
            await api.post('/cart', { products: selectedProducts.map(p => p.id) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.show({ title: 'Produtos adicionados ao carrinho', duration: 3000 });
            setSelectedProducts([]);
        } catch (err) {
            console.error(err);
            toast.show({ title: 'Erro', description: 'Não foi possível adicionar ao carrinho', duration: 3000 });
        }
    };

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold>Lojas + produtos</Text>  

                <Input  
                    placeholder="Pesquisar loja ou produto"
                    mt={4}
                    mb={4}
                    value={search}
                    onChangeText={setSearch}
                />

                {loading ? (
                    <Text mt={10}>Carregando...</Text>
                ) : (
                    <FlatList
                        data={filteredStores} 
                        keyExtractor={store => store.id.toString()}
                        renderItem={({ item: store }) => (
                            <Box mb={6} borderWidth={1} borderRadius="md" borderColor="gray.200" p={4}>
                                <Text fontSize="lg" bold mb={2}>{store.legal_name}</Text>
                                <VStack space={2}>
                                    {store.products.map(product => (
                                        <HStack key={product.id} alignItems="center" justifyContent="space-between">
                                        <Checkbox
                                            isChecked={!!selectedProducts.find(p => p.id === product.id)}
                                            onChange={() => toggleProduct(product)}
                                            value={product.id.toString()}
                                        >
                                            <Text ml={2}>{product.name} - R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>
                                        </Checkbox>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    />
                )}

                {selectedProducts.length > 0 && (
                    <Button onPress={addToCart} mt={4}>
                        Adicionar {selectedProducts.length} produto(s) ao carrinho
                    </Button>
                )}
            </VStack>      
        </LayoutWithSidebar>
    );
}