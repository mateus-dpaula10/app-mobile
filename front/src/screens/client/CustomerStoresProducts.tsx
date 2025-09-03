import React, { useState } from 'react';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box, Button, HStack, IconButton, Image, Input, Text, useToast, VStack } from 'native-base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
    final_name: string;
    cnpj: string;
    phone: string;
    address: string;
    plan: string;
    active: boolean;
    products: Product[];
}

type CartItem = {
    product: Product;
    quantity: number;
}

type RootStackParamList = {
    CustomerStores: undefined;
    CustomerStoresProducts: { store: Store }
};

type CustomerStoresProductsProps = NativeStackScreenProps<RootStackParamList, 'CustomerStoresProducts'>;
 
export default function CustomerStoresProducts({ route }: CustomerStoresProductsProps) {
    const { store } = route.params;
    const [cart, setCart] = useState<CartItem[]>([]);
    const toast = useToast();

    const updateCart = (product: Product, delta: number) => {
        setCart(prev => {
            const existing = prev.find(c => c.product.id === product.id);
            if (existing) {
                const newQty = existing.quantity + delta;
                if (newQty <= 0) return prev.filter(c => c.product.id !== product.id);
                return prev.map(c => c.product.id === product.id ? { ...c, quantity: newQty } : c);
            } else if (delta > 0) {
                return [...prev, { product, quantity: delta }];
            }
            return prev;
        });
    };

    const addToCart = async () => {
        if (!cart.length) {
            toast.show({ title: 'Selecione produtos', duration: 2000 });
            return;
        }

        try {
            const token = await AsyncStorage.getItem('@token');
            await api.post('/cart', {
                products: cart.map(c => ({ id: c.product.id, quantity: c.quantity }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.show({ title: 'Produtos adicionados ao carrinho', duration: 3000 });
            setCart([]);
        } catch (err) {
            console.error(err);
            toast.show({ title: 'Erro', description: 'Não foi possível adicionar ao carrinho', duration: 3000 });
        }
    };

    const renderProductCard = (product: Product) => {   
        const cartItem = cart.find(c => c.product.id === product.id);
        const quantity = cartItem?.quantity || 0;

        return (
            <Box
                key={product.id}
                borderWidth={1}
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                shadow={2}
                m={2}
                flexDirection="row"
            >
                <FlatList
                    data={product.images && product.images.length > 0 
                        ? product.images 
                        : []}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={img => `${product.id}-${img.id}`}
                    renderItem={({ item }) => (
                        <Image
                            source={{ uri: `http://localhost:8000/storage/${item.image_path}` }}
                            alt={product.name}
                            width={150}
                            height={150}
                            resizeMode="cover"
                        />
                    )}
                    style={{ flexGrow: 0 }}
                />

                <VStack flex={1} p={3} space={2}>
                    <Text bold fontSize="md" numberOfLines={1}>{product.name}</Text>
                    {product.description ? (
                        <Text fontSize="sm" color="gray.600" numberOfLines={2}>{product.description}</Text>
                    ) : null}
                    <Text fontSize="sm" color="gray.800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>
                    <Text fontSize="sm" color="gray.500">Estoque: {product.stock_quantity}</Text>

                    <HStack alignItems="center" space={2}>
                        <IconButton
                            icon={<Ionicons name="remove-circle-outline" size={24} color="gray" />}
                            onPress={() => updateCart(product, -1)}
                            isDisabled={quantity <= 0}
                        />
                        <Input
                            value={quantity.toString()}
                            isReadOnly
                            textAlign="center"
                            width={12}
                            height={10}
                            fontSize="md"
                        />
                        <IconButton
                            icon={<Ionicons name="add-circle-outline" size={24} color="blue" />}
                            onPress={() => updateCart(product, 1)}
                            isDisabled={quantity >= product.stock_quantity}
                        />
                    </HStack>

                    <Button
                        mt={2}
                        size="sm"
                        colorScheme="blue"
                        onPress={() => updateCart(product, 1)}
                    >
                        Adicionar ao carrinho
                    </Button>
                </VStack>
            </Box>
        );
    };

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold fontSize="xl" mb={4}>
                    {store.final_name}
                </Text>
                
                <FlatList
                    data={store.products} 
                    keyExtractor={p => p.id.toString()}
                    renderItem={({ item }) => renderProductCard(item)}
                />

                {cart.length > 0 && (
                    <Button mt={4} onPress={addToCart}>
                        Adicionar {cart.reduce((sum, c) => sum + c.quantity, 0)} produto(s) ao carrinho
                    </Button>
                )}
            </VStack>      
        </LayoutWithSidebar>
    );
}