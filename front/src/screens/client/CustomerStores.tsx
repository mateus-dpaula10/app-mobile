import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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

type RootStackParamList = {
    CustomerStores: undefined;
    CustomerStoresProducts: { store: Store }
};

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerStores'>
 
export default function CustomerStores({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState<Store[]>([]);
    const [search, setSearch] = useState('');
    const toast = useToast();

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
        .filter(store => store.final_name.toLowerCase().includes(search.toLowerCase())
    );

    function formatPhone(phone: string) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }

    const renderStoreCard = (store: Store) => (
        <Box
            key={store.id}
            borderWidth={1}
            borderColor="gray.200"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            shadow={2}
            m={2}
            flex={1}
        >
            <VStack p={3} space={2}>
                <Text bold fontSize="lg">{store.final_name}</Text>
                {store.phone && (
                    <Text fontSize="sm" color="gray.600">Telefone: {formatPhone(store.phone)}</Text>
                )}
                {store.address && ((
                    <Text fontSize="sm" color="gray.600">Endereço: {store.address}</Text>
                ))}
                <Button mt={2} colorScheme="blue" onPress={() => navigation.navigate('CustomerStoresProducts', { store })}>
                    Ver produtos
                </Button>
            </VStack>
        </Box>
    );

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold fontSize="xl">Lojas disponíveis</Text>  

                <Input  
                    placeholder="Pesquisar loja"
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
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        keyExtractor={store => store.id.toString()}
                        renderItem={({ item }) => renderStoreCard(item)}
                    />
                )}
            </VStack>      
        </LayoutWithSidebar>
    );
}