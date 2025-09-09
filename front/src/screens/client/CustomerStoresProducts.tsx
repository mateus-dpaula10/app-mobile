import React, { useState } from 'react';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box, Button, HStack, IconButton, Image, Input, Text, useToast, VStack } from 'native-base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';

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

type ProductCardProps = {
    product: Product;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void
};
 
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
            const companyIds = cart.map(c => c.product.company_id);
            const uniqueCompanyIds = [...new Set(companyIds)];

            if (uniqueCompanyIds.length > 1) {
                toast.show({
                    title: 'Atenção',
                    description: 'Só é possível adicionar produtos da mesma loja ao carrinho',
                    duration: 3000
                });
                return;
            }

            const response = await api.post(
                '/cart', 
                { products: cart.map(c => ({ id: c.product.id, quantity: c.quantity })) },
                {   headers: { Authorization: `Bearer ${token}` } }
            );

            toast.show({ title: 'Produtos adicionados ao carrinho', duration: 3000 });
            setCart([]);
        } catch (err: unknown) {
            console.error(err);
            let message = 'Não foi possível adicionar ao carrinho';
            if (err instanceof AxiosError) {
                message = err.response?.data?.message || message;
            }
            toast.show({ title: 'Erro', description: message, duration: 3000 });
        }
    };

    function ProductCard({ product, quantity, onAdd, onRemove }: ProductCardProps) {
        const [currentIndex, setCurrentIndex] = useState(0);
        const outOfStock = product.stock_quantity <= 0;

        const prevImage = () => {
            setCurrentIndex(i => (i - 1 + product.images.length) % product.images.length);
        };
    
        const nextImage = () => {
            setCurrentIndex(i => (i + 1) % product.images.length);
        };

        return (
            <Box
                borderWidth={1}
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                shadow={2}
                m={2}
            >
                {product.images && product.images.length > 0 && (
                    <Box position="relative" width="100%" height={200}>
                        <Image
                            source={{ uri: `http://localhost:8000/storage/${product.images[currentIndex].image_path}` }}
                            alt={product.name}
                            width="100%"
                            height="100%"
                            resizeMode="cover"
                        />
                        <HStack position="absolute" top="50%" left={0} right={0} justifyContent="space-between" px={2}>
                            <IconButton icon={<Ionicons name="chevron-back-circle" size={32} color="white" />} onPress={prevImage} />
                            <IconButton icon={<Ionicons name="chevron-forward-circle" size={32} color="white" />} onPress={nextImage} />
                        </HStack>
                    </Box>
                )}
    
                <VStack flex={1} p={3} space={2}>
                    <Text bold fontSize="md">{product.name}</Text>
                    {product.description &&
                        <Text fontSize="sm" color="gray.600" numberOfLines={2}>{product.description}</Text>
                    }
                    <Text fontSize="sm" color="gray.800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>
                    
                    {outOfStock ? (
                        <Text fontSize="sm" color="red.500" bold>Esgotado</Text>
                    ) : (
                        <HStack alignItems="center" space={2}>
                            <IconButton
                                icon={<Ionicons name="remove-circle-outline" size={24} color="gray" />}
                                onPress={onRemove}
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
                                onPress={onAdd}
                                isDisabled={quantity >= product.stock_quantity}
                            />
                        </HStack>
                    )}
    
                    <Button
                        mt={2}
                        size="sm"
                        colorScheme="blue"
                        onPress={onAdd}
                        isDisabled={outOfStock}
                    >
                        {outOfStock ? 'Indisponível' : 'Adicionar ao carrinho'}
                    </Button>
                </VStack>
            </Box>
        );
    }

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold fontSize="xl" mb={4}>
                    {store.final_name}
                </Text>
                
                <FlatList
                    data={store.products} 
                    keyExtractor={p => p.id.toString()}
                    renderItem={({ item }) => {
                        const cartItem = cart.find(c => c.product.id === item.id);
                        const quantity = cartItem?.quantity || 0;
                        return (
                            <ProductCard
                                product={item}
                                quantity={quantity}
                                onAdd={() => updateCart(item, 1)}
                                onRemove={() => updateCart(item, -1)}
                            />
                        )
                    }}
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