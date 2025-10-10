import React, { useEffect, useState } from 'react';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import { Box, Button, HStack, Image, Text, useToast, VStack } from 'native-base';
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

type StoreOrder = {
    id: number;
    code: string;
    created_at: Date;
    status: string;
    total: number;
    user: { name: string };
    items: OrderItem[];
}
 
export default function StoreOrders() {
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const toast = useToast();

    const fetchOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.get('/orders-store', {
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

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const token = await AsyncStorage.getItem('@token');
            await api.patch(`/orders-store/${orderId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            toast.show({ title: 'Pedido marcado como pago / pronto para retirada', duration: 3000 });
            fetchOrders(); 
        } catch (err) {
            console.error(err);
        }
    };

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
            case 'retirada':
                return 'pronto para retirada';
            default:
                return status;
        }
    }

    const renderOrderItem = ({ item }: { item: OrderItem }) => (        
        <Box borderWidth={1} borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white" shadow={1} m={2}>
            <HStack>
                {item.product.images && item.product.images.length > 0 && (
                    <Image
                        source={{ uri: `http://192.168.0.72:8000/storage/${item.product.images[0].image_path}` }}
                        alt={item.product.name}
                        width={100}
                        height="100%"
                        resizeMode="cover"
                    />
                )}
                <VStack flex={1} p={3} space={2}>
                    <Text bold fontSize="md">{item.product.name}</Text>
                    <Text fontSize="sm" color="gray.600" numberOfLines={2}>{item.product.description}</Text>
                    <Text fontSize="sm" color="gray.800">Preço unitário: R$ {Number(item.price).toFixed(2).replace('.', ',')}</Text>
                    <Text fontSize="sm" color="gray.700">Quantidade: {item.quantity}</Text>
                </VStack>
            </HStack>
        </Box>
    );

    const renderOrder = ({ item }: { item: StoreOrder }) => (
        <Box borderWidth={1} borderColor="blue.300" borderRadius="lg" p={3} mb={4}>
            <Text bold fontSize="md" mb={2}>Pedido: {item.code} | Status: {getStatusLabel(item.status)} | Cliente: {item.user.name} | Data do pedido: {new Date(item.created_at).toLocaleString()}</Text>
            <FlatList
                data={item.items}
                keyExtractor={i => i.id.toString()}
                renderItem={renderOrderItem}
            />
            <Text bold mt={2} textAlign="right">Total: R$ {Number(item.total).toFixed(2).replace('.', ',')}</Text>
            {item.status === 'pending' && (
                <Button mt={2} colorScheme="green" onPress={() => updateStatus(item.id, 'ready_for_pickup')}>
                    Marcar como pago / pronto para retirada
                </Button>
            )}
        </Box>
    );

    return (
        <LayoutWithSidebar>
            <VStack mt={10} flex={1} px={4}>
                <Text bold fontSize="xl" mb={4}>Pedidos da Loja</Text>

                {orders.length === 0 ? (
                    <Text textAlign="center" mt={10}>Nenhum pedido pendente</Text>
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