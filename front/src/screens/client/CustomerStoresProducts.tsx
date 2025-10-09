import React, { useState } from 'react';
import api from '../../services/api';
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box, Button, HStack, IconButton, Image, Input, Text, useToast, VStack } from 'native-base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';

type ProductImage = {
  id: number;
  product_id: number;
  image_path: string;
};

type ProductVariation = {
  id: number;
  type: string;
  value: string;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  company_id: number;
  images: ProductImage[];
  variations?: ProductVariation[];
};

type Store = {
  id: number;
  final_name: string;
  products: Product[];
};

type CartItem = {
  product: Product;
  quantity: number;
  selectedVariations?: Record<string, ProductVariation>;
};

type RootStackParamList = {
  CustomerStores: undefined;
  CustomerStoresProducts: { store: Store };
};

type CustomerStoresProductsProps = NativeStackScreenProps<RootStackParamList, 'CustomerStoresProducts'>;

export default function CustomerStoresProducts({ route }: CustomerStoresProductsProps) {
  const { store } = route.params;
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();

  const updateCart = (
    product: Product,
    delta: number,
    selectedVariations?: Record<string, ProductVariation>
  ) => {
    setCart(prev => {
      const existing = prev.find(
        c =>
          c.product.id === product.id &&
          JSON.stringify(c.selectedVariations || {}) === JSON.stringify(selectedVariations || {})
      );

      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(
            c =>
              !(c.product.id === product.id &&
              JSON.stringify(c.selectedVariations || {}) === JSON.stringify(selectedVariations || {}))
          );
        }
        return prev.map(
          c =>
            c.product.id === product.id &&
            JSON.stringify(c.selectedVariations || {}) === JSON.stringify(selectedVariations || {})
              ? { ...c, quantity: newQty }
              : c
        );
      } else if (delta > 0) {
        return [...prev, { product, quantity: delta, selectedVariations }];
      }

      return prev;
    });
  };

  const addToCart = async () => {
    if (!cart.length) {
        return toast.show({ title: 'Selecione produtos', duration: 2000 });
    }

    try {
        const token = await AsyncStorage.getItem('@token');

        const companyIds = cart.map(c => c.product.company_id);
        if ([...new Set(companyIds)].length > 1) {
            return toast.show({
                title: 'Atenção',
                description: 'Só é possível adicionar produtos da mesma loja ao carrinho',
                duration: 3000
            });
        }

        await api.post(
            '/cart',
            { 
                products: cart.map(c => ({
                    id: c.product.id,
                    quantity: c.quantity,
                    variation_ids: Object.values(c.selectedVariations || {}).map(v => Number(v.id))
                }))
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.show({ title: 'Produtos adicionados ao carrinho', duration: 3000 });
        setCart([]);
    } catch (err: unknown) {
        console.error(err);
        let message = 'Não foi possível adicionar ao carrinho';
        if (err instanceof AxiosError) message = err.response?.data?.message || message;
        toast.show({ title: 'Erro', description: message, duration: 3000 });
    }
  };

  function ProductCard({
    product,
    quantity,
    onAdd,
    onRemove
  }: {
    product: Product;
    quantity: number;
    onAdd: (selectedVariations?: Record<string, ProductVariation>) => void;
    onRemove: () => void;
  }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedVariations, setSelectedVariations] = useState<Record<string, ProductVariation>>({});
    const outOfStock = product.stock_quantity <= 0;

    const prevImage = () => setCurrentIndex(i => (i - 1 + product.images.length) % product.images.length);
    const nextImage = () => setCurrentIndex(i => (i + 1) % product.images.length);

    const handleSelectVariation = (variation: ProductVariation) => {
      setSelectedVariations(prev => ({ ...prev, [variation.type]: variation }));
    };

    return (
      <Box borderWidth={1} borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white" shadow={2} m={2}>
        {product.images.length > 0 && (
          <Box position="relative" width="100%" height={200}>
            <Image
              source={{ uri: `http://192.168.0.72:8000/storage/${product.images[currentIndex].image_path}` }}
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
          {product.description && <Text fontSize="sm" color="gray.600" numberOfLines={2}>{product.description}</Text>}
          <Text fontSize="sm" color="gray.800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>

          {product.variations && product.variations.length > 0 && (
            <HStack flexWrap="wrap" space={2}>
              {product.variations.map(v => (
                <Button
                  key={v.id}
                  size="sm"
                  variant={selectedVariations[v.type]?.id === v.id ? 'solid' : 'outline'}
                  onPress={() => handleSelectVariation(v)}
                >
                  {v.type}: {v.value}
                </Button>
              ))}
            </HStack>
          )}

          {outOfStock ? (
            <Text fontSize="sm" color="red.500" bold>Esgotado</Text>
          ) : (
            <HStack alignItems="center" space={2}>
              <IconButton icon={<Ionicons name="remove-circle-outline" size={24} color="gray" />} onPress={onRemove} isDisabled={quantity <= 0} />
              <Input value={quantity.toString()} isReadOnly textAlign="center" width={12} height={10} fontSize="md" />
              <IconButton 
                icon={<Ionicons name="add-circle-outline" size={24} color="blue" />} 
                onPress={() => onAdd(selectedVariations)} 
                isDisabled={(quantity || 0) >= (product.stock_quantity || 0)}
            />
            </HStack>
          )}

          <Button
            mt={2}
            size="sm"
            colorScheme="blue"
            onPress={() => onAdd(selectedVariations)}
            isDisabled={
              outOfStock ||
              Object.keys(selectedVariations).length < new Set(product.variations?.map(v => v.type) || []).size
            }
          >
            {outOfStock ? 'Indisponível' : 'Adicionar ao carrinho'}
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <FlatList
        ListHeaderComponent={
          <VStack mt={10} px={4}>
            <Text bold fontSize="xl" mb={4}>{store.final_name}</Text>
          </VStack>
        }
        data={store.products}
        keyExtractor={p => p.id.toString()}
        renderItem={({ item }) => {
          const cartItem = cart.find(
            c =>
              c.product.id === item.id
          );
          const quantity = cartItem?.quantity || 0;
          return (
            <ProductCard
              product={item}
              quantity={quantity}
              onAdd={(selectedVariations) => updateCart(item, 1, selectedVariations)}
              onRemove={() => updateCart(item, -1)}
            />
          );
        }}
        ListFooterComponent={
          cart.length > 0 ? (
            <Button mt={4} mx={4} mb={8} onPress={addToCart}>
              <HStack space={1} alignItems="center">
                <Text color="white">Adicionar</Text>
                <Text color="white">{cart.reduce((sum, c) => sum + c.quantity, 0)}</Text>
                <Text color="white">produto(s) ao carrinho</Text>
              </HStack>
            </Button>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}
