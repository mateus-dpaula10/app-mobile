import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList, Image } from 'react-native';
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
    category: string;
    logo?: string;
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = [
        { 
            name: 'Supermercado', 
            image: 'http://192.168.0.72:8000/storage/categories/supermercado.jpg'
        },
        { 
            name: 'Padaria', 
            image: 'http://192.168.0.72:8000/storage/categories/padaria.jpg'
        },
        { 
            name: 'Restaurante', 
            image: 'http://192.168.0.72:8000/storage/categories/restaurante.jpg'
        },
        { 
            name: 'Bebidas', 
            image: 'http://192.168.0.72:8000/storage/categories/bebidas.jpg'
        },
        { 
            name: 'Doces e Sobremesas', 
            image: 'http://192.168.0.72:8000/storage/categories/sobremesas.jpg'
        },
        { 
            name: 'Farmácia', 
            image: 'http://192.168.0.72:8000/storage/categories/farmacia.jpg'
        },
        { 
            name: 'Pet Shop', 
            image: 'http://192.168.0.72:8000/storage/categories/petshop.jpg'
        },
        { 
            name: 'Moda e Acessórios', 
            image: 'http://192.168.0.72:8000/storage/categories/moda.jpg'
        },
        { 
            name: 'Eletrônicos', 
            image: 'http://192.168.0.72:8000/storage/categories/eletronicos.jpg'
        },
        { 
            name: 'Casa e Decoração', 
            image: 'http://192.168.0.72:8000/storage/categories/casa_decoracao.jpg'
        },
        { 
            name: 'Saúde e Beleza', 
            image: 'http://192.168.0.72:8000/storage/categories/beleza.jpg'
        },
        { 
            name: 'Esporte e Lazer', 
            image: 'http://192.168.0.72:8000/storage/categories/esportes.jpg'
        },
        { 
            name: 'Livraria', 
            image: 'http://192.168.0.72:8000/storage/categories/livraria.jpg'
        },
    ];

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/companies-with-products');
                console.log(response.data);
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
        .filter(store => {
            if (!search && !selectedCategory) return false;

            const searchLower = search.toLowerCase();
            const matchesStoreName = store.final_name.toLowerCase().includes(searchLower);
            const matchesProductName = store.products.some(product => 
                product.name.toLowerCase().includes(searchLower)
            );

            const matchesCategory = !selectedCategory || store.category === selectedCategory;

            return (matchesStoreName || matchesProductName) && matchesCategory;
        });

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
            flex={1}
            margin={2}
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            shadow={2}
        >
            <VStack p={3} space={2} alignItems="center">
                {store.logo && (
                    <Image
                        source={{ uri: `http://192.168.0.72:8000/storage/${store.logo.replace(/^\/+/, '')}` }}
                        style={{ width: 80, height: 80, borderRadius: 10 }}
                        resizeMode="cover"
                    />
                )}

                <Text bold fontSize="lg" textAlign="center">{store.final_name}</Text>

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
                    placeholder="Pesquisar loja ou produto"
                    mt={4}
                    mb={4}
                    value={search}
                    onChangeText={setSearch}
                />

                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.name}
                    numColumns={4}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                    renderItem={({ item }) => (
                        <Button
                            variant="ghost"
                            onPress={() => 
                                setSelectedCategory(item.name === selectedCategory ? null : item.name)
                            }
                            flex={1}
                            style={{ marginHorizontal: 4 }}
                        >
                            <VStack alignItems="center">
                                <Image
                                    source={{ uri: item.image }}
                                    style={{ width: 60, height: 60, borderRadius: 10 }}
                                    resizeMode="cover"
                                />
                                <Text mt={2} fontSize="xs" textAlign="center">
                                    {item.name}
                                </Text>
                            </VStack>
                        </Button>
                    )}
                />

                {loading ? (
                    <Text mt={10}>Carregando...</Text>
                ) : filteredStores.length > 0 ? (
                    <FlatList
                        data={filteredStores} 
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        keyExtractor={store => store.id.toString()}
                        renderItem={({ item }) => renderStoreCard(item)}
                    />
                ) : (
                    <Text mt={10} color="gray.500" textAlign="center">
                        Selecione um categoria para ver as lojas
                    </Text>
                )}
            </VStack>      
        </LayoutWithSidebar>
    );
}