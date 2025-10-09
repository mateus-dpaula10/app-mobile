import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, Image, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

type ProductImage = {
    id: number;
    product_id: number;
    image_path: string;
};

type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    company_id: number;
    images: ProductImage[];
};

type OrderItem = {
    id: number;
    product: Product;
    quantity: number;
    price: string | number;
};

type StoreOrder = {
    id: number;
    code: string;
    created_at: Date;
    status: string;
    total: number;
    user: { name: string };
    items: OrderItem[];
};
 
export default function DeliveryOrders() {
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const toast = useToast();

    const fetchOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.get('/orders-driver', {
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

    const acceptOrder = async (orderId: number) => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const response = await api.patch(`/orders-driver/${orderId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.show({ title: 'Pedido aceito', duration: 3000 });
            fetchOrders();
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const token = await AsyncStorage.getItem('@token');
            await api.patch(`/orders-driver/${orderId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ready_for_pickup':
                return 'pronto para retirada';
            case 'on_the_way':
                return 'em rota de entrega';
            case 'delivered':
                return 'entregue';
            default:
                return status;
        }
    };

    const renderOrderItem = ({ item }: { item: OrderItem }) => (
        <Box borderWidth={1} borderColor="gray.200" borderRadius="lg" bg="white" shadow={1} m={2}>
            <HStack>
                {item.product.images?.[0] && (
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
                    <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                        {item.product.description}
                    </Text>
                    <Text fontSize="sm">Preço unitário: R$ {Number(item.price).toFixed(2).replace('.', ',')}</Text>
                    <Text fontSize="sm">Quantidade: {item.quantity}</Text>
                </VStack>
            </HStack>
        </Box>
    )

    const renderOrder = ({ item }: { item: StoreOrder }) => (
        <Box borderWidth={1} borderColor="green.400" borderRadius="lg" p={3} mb={4}>
            <Text bold mb={2}>
                Pedido: {item.code} | Status: {getStatusLabel(item.status)} | Cliente: {item.user.name}
            </Text>

            <FlatList
                data={item.items}
                keyExtractor={i => i.id.toString()}
                renderItem={renderOrderItem}
            />  

            <Text bold mt={2} textAlign="right">
                Total: R$ {Number(item.total).toFixed(2).replace('.', ',')}
            </Text>

            {item.status === 'ready_for_pickup' && (
                <Button onPress={() => acceptOrder(item.id)} colorScheme="green">
                    Aceitar pedido
                </Button>
            )}

            {item.status === 'accepted' && (
                <Button mt={2} colorScheme="blue" onPress={() => updateStatus(item.id, 'on_the_way')}>
                    Iniciar entrega
                </Button>
            )}

            {item.status === 'on_the_way' && (
                <Button mt={2} colorScheme="green" onPress={() => updateStatus(item.id, 'delivered')}>
                    Marcar como entregue
                </Button>
            )}
        </Box>
    );

    return (
        <LayoutWithSidebar>
            <VStack mt={10} flex={1} px={4}>
                <Text bold fontSize="xl" mb={4}>Pedidos para Entrega</Text>

                {orders.length === 0 ? (
                    <Text textAlign="center" mt={10}>Nenhum pedido disponível</Text>
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