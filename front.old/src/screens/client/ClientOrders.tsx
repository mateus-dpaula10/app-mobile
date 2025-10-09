import React, { useEffect, useState } from 'react';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import { Box, HStack, Image, Text, VStack } from 'native-base';
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

type OrderItem = {
    id: number;
    product: Product;
    quantity: number;
    price: string | number;
}

type Store = {
    id: number;
    final_name: string;
}

type Order = {
    id: number;
    code: string;
    created_at: Date;
    status: string;
    total: number;
    store: Store;
    items: OrderItem[];
}
 
export default function ClientOrders() {
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.get('/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.orders);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'pendente';
            case 'processing':
                return 'em processamento';
            case 'completed':
                return 'concluído';
            case 'canceled':
                return 'cancelado';
            case 'ready_for_pickup':
                return 'pronto para retirada';
            default:
                return status;
        }
    }

    const renderOrderItem = ({ item }: { item: OrderItem }) => {
        const { product, quantity, price } = item;
        const outOfStock = product.stock_quantity <= 0;

        return (
            <Box borderWidth={1} borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white" shadow={1} m={2}>
                <HStack>
                    {product.images && product.images.length > 0 && (
                        <Image
                            source={{ uri: `http://192.168.0.72:8000/storage/${product.images[0].image_path}` }}
                            alt={product.name}
                            width={100}
                            height="100%"
                            resizeMode="cover"
                        />
                    )}
                    <VStack flex={1} p={3} space={2}>
                        <Text bold fontSize="md">{product.name}</Text>
                        <Text fontSize="sm" color="gray.600" numberOfLines={2}>{product.description}</Text>
                        <Text fontSize="sm" color="gray.800">Preço unitário: R$ {Number(price).toFixed(2).replace('.', ',')}</Text>
                        <Text fontSize="sm" color="gray.700">Quantidade: {quantity}</Text>
                        {outOfStock && <Text fontSize="sm" color="red.500" bold>Esgotado</Text>}
                    </VStack>
                </HStack>
            </Box>
        );
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <Box borderWidth={1} borderColor="blue.300" borderRadius="lg" p={3} mb={4}>
            <Text bold fontSize="md" mb={2}>Pedido: {item.code} | Status: {getStatusLabel(item.status)} | Loja: {item.store.final_name} | Data do pedido: {new Date(item.created_at).toLocaleString()}</Text>
            <FlatList
                data={item.items}
                keyExtractor={i => i.id.toString()}
                renderItem={renderOrderItem}
            />
            <Text bold mt={2} textAlign="right">Total: R$ {Number(item.total).toFixed(2).replace('.', ',')}</Text>
        </Box>
    );

    return (
        <LayoutWithSidebar>
            <VStack mt={10} flex={1} px={4}>
                <Text bold fontSize="xl" mb={4}>Meus Pedidos</Text>

                {orders.length === 0 ? (
                    <Text textAlign="center" mt={10}>Nenhum pedido encontrado</Text>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderOrder}
                    />
                )}
            </VStack>
        </LayoutWithSidebar>
    );
}