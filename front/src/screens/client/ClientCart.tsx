import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useIsFocused } from '@react-navigation/native';

type ProductImage = { id: number; product_id: number; image_path: string };
type ProductVariation = { id: number; type: string; value: string };
type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  company_id: number;
  images: ProductImage[];
};

type CartItem = {
  id: number;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  variations: ProductVariation[];
  variation_key?: string; // string "Tamanho:M | Sabor:Calabresa"
};

export default function ClientCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) fetchCart();
  }, [isFocused]);

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const response = await api.get('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.cart?.items) {
        const items: CartItem[] = response.data.cart.items;
        setCart(items);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err);
      Alert.alert('Erro', 'Não foi possível carregar o carrinho');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('@token');
      await api.delete(`/cart/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(prev => prev.filter(c => c.id !== itemId));
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível remover o produto');
    }
  };

  const incrementQuantity = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('@token');
      await api.put(`/cart/items/${itemId}/increment`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
    } catch (err) {
      console.error('Erro ao aumentar quantidade:', err);
    }
  };

  const decrementQuantity = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('@token');
      await api.put(`/cart/items/${itemId}/decrement`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
    } catch (err) {
      console.error('Erro ao diminuir quantidade:', err);
    }
  };

  const getTotal = () => cart.reduce((sum, c) => sum + c.subtotal, 0);

  const checkout = async () => {
    if (!cart.length) return Alert.alert('Aviso', 'Seu carrinho está vazio');
    try {
      const token = await AsyncStorage.getItem('@token');
      await api.post(
        '/cart/checkout',
        {
          items: cart.map(c => ({
            id: c.id,
            product_id: c.product.id,
            quantity: c.quantity,
            variation_ids: c.variations.map(v => v.id),
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Sucesso', 'Pedido criado com sucesso');
      setCart([]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Erro no checkout');
    }
  };

  const CartItemCard = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      {item.product.images?.length > 0 && (
        <Image
          source={{
            uri: `http://192.168.0.79:8000/storage/${item.product.images[0].image_path}`,
          }}
          style={styles.image}
        />
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Ionicons name="trash-outline" size={22} color="red" />
          </TouchableOpacity>
        </View>

        <Text numberOfLines={2} style={styles.description}>
          {item.product.description}
        </Text>

        {item.variation_key && (
          <Text style={styles.variationKey}>{item.variation_key}</Text>
        )}

        <Text style={styles.price}>
          R$ {Number(item.price).toFixed(2).replace('.', ',')}
        </Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={() => decrementQuantity(item.id)}
            disabled={item.quantity <= 1}
          >
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={item.quantity <= 1 ? '#ccc' : 'gray'}
            />
          </TouchableOpacity>

          <Text style={styles.qty}>{item.quantity}</Text>

          <TouchableOpacity
            onPress={() => incrementQuantity(item.id)}
            disabled={item.quantity >= item.product.stock_quantity}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={
                item.quantity >= item.product.stock_quantity ? '#ccc' : 'blue'
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 16 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <Text style={styles.title}>Meu Carrinho</Text>

      {cart.length === 0 ? (
        <Text style={styles.emptyCart}>Seu carrinho está vazio</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <CartItemCard item={item} />}
          ListFooterComponent={
            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  R$ {getTotal().toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={checkout}>
                <Text style={styles.checkoutText}>Prosseguir para pagamento</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  image: { width: 100, height: '100%', resizeMode: 'cover' },
  cardContent: { flex: 1, padding: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: { fontWeight: 'bold', fontSize: 16 },
  description: { fontSize: 13, color: '#666', marginVertical: 4 },
  variationKey: { fontSize: 13, color: '#007bff', marginBottom: 4 },
  price: { fontSize: 14, color: '#333' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qty: { marginHorizontal: 10, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyCart: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#555' },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    marginTop: 12,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontWeight: 'bold', fontSize: 16 },
  totalValue: { fontWeight: 'bold', fontSize: 16 },
  checkoutBtn: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});