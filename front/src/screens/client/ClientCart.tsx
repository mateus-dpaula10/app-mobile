import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, IconButton, Image, Text, useToast, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { FlatList } from 'react-native';

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

type CartItem = {
    product: Product;
    quantity: number;
}
 
export default function ClientCart() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const toast = useToast();

    const fetchCart = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.get('/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log(response);
            
            if (response.data.cart) {
                setCart(response.data.cart.items.map((item: any) => ({
                    product: item.product,
                    quantity: item.quantity
                })));
            }
        } catch (err) {
            console.error(err);
            toast.show({
                title: 'Erro',
                description: 'Não foi possível carregar o carrinho',
                duration: 3000
            });
        }
    }

    useEffect(() => {
        fetchCart();
    }, []);

    const updateCart = (product: Product, delta: number) => {
        setCart(prev => {
            const existing = prev.find(c => c.product.id === product.id);
            if (existing) {
                const newQty = existing.quantity + delta;
                if (newQty < 0) return prev.filter(c => c.product.id !== product.id);
                return prev.map(c => c.product.id === product.id ? { ...c, quantity: newQty } : c);
            } else if (delta > 0) {
                return [...prev, { product, quantity: delta }];
            }
            return prev;
        });
    };

    const getTotal = () => {
        return cart.reduce((sum, c) => sum + c.quantity * c.product.price, 0);
    };

    const checkout = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.post(
                '/cart/checkout',
                { products: cart.map(c => ({ id: c.product.id, quantity: c.quantity })) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.show({ title: 'Compra realizada', duration: 3000 });
            setCart([]);
        } catch (err: unknown) {
            console.error(err);
            let message = 'Erro no checkout';
            toast.show({ title: 'Erro', description: message, duration: 3000 });
        }
    };  

    function CartItemCard({ item }: { item: CartItem }) {
        const { product, quantity } = item;
        const outOfStock = product.stock_quantity <= 0;
        const toast = useToast();

        const removeItem = async () => {
            try {
                const token = await AsyncStorage.getItem('@token');
                await api.delete(`/cart/items/${product.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCart(prev => prev.filter(c => c.product.id !== product.id));
                toast.show({ title: 'Produto removido do carrinho', duration: 3000 });
            } catch (err) {
                console.error(err);
                toast.show({ title: 'Erro', description: 'Não foi possível remover do carrinho', duration: 3000 });
            }
            setCart(prev => prev.filter(c => c.product.id !== product.id));
        };

        return (
            <Box borderWidth={1} borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white" shadow={1} m={2}>
                <HStack>
                    {product.images && product.images.length > 0 && (
                        <Image
                            source={{ uri: `http://localhost:8000/storage/${product.images[0].image_path}` }}
                            alt={product.name}
                            width={100}
                            height={100}
                            resizeMode="cover"
                        />
                    )}
                    <VStack flex={1} p={3} space={2}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text bold fontSize="md">{product.name}</Text>
                            <IconButton 
                                icon={<Ionicons name="trash-outline" size={24} color="red" />}
                                onPress={removeItem}
                            />
                        </HStack>

                        <Text fontSize="sm" color="gray.600" numberOfLines={2}>{product.description}</Text>
                        <Text fontSize="sm" color="gray.800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>

                        {!outOfStock && (
                            <HStack alignItems="center" space={2}>
                                <IconButton
                                    icon={<Ionicons name="remove-circle-outline" size={24} color="gray" />}
                                    onPress={() => updateCart(product, -1)}
                                    isDisabled={quantity <= 0}
                                />
                                <Text fontSize="md" width={8} textAlign="center">{quantity}</Text>
                                <IconButton
                                    icon={<Ionicons name="add-circle-outline" size={24} color="blue" />}
                                    onPress={() => updateCart(product, 1)}
                                    isDisabled={quantity >= product.stock_quantity}
                                />
                            </HStack>
                        )}

                        {outOfStock && (
                            <Text fontSize="sm" color="red.500" bold mt={2}>Esgotado</Text>
                        )}
                    </VStack>
                </HStack>
            </Box>
        );
    }

    return (
        <LayoutWithSidebar>
            <VStack mt={10} flex={1}>
                <Text bold fontSize="xl" mb={4}>Meu Carrinho</Text>

                {cart.length === 0 ? (
                    <Text textAlign="center" mt={10}>Seu carrinho está vazio</Text>
                    ) : (
                    <>
                        <FlatList
                            data={cart}
                            keyExtractor={item => item.product.id.toString()}
                            renderItem={({ item }) => <CartItemCard item={item} />}
                        />
                        <Box p={4} borderTopWidth={1} borderColor="gray.200">
                            <HStack justifyContent="space-between" mb={2}>
                                <Text bold>Total:</Text>
                                <Text bold>R$ {getTotal().toFixed(2).replace('.', ',')}</Text>
                            </HStack>
                            <Button onPress={checkout} colorScheme="blue">
                                Finalizar Compra
                            </Button>
                        </Box>
                    </>
                )}
            </VStack>
        </LayoutWithSidebar>
    );
}