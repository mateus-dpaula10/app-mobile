import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useIsFocused } from '@react-navigation/native';

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

type Store = {
  id: number;
  final_name: string;
};

type Order = {
  id: number;
  code: string;
  created_at: string;
  status: string;
  total: number;
  store: Store;
  items: OrderItem[];
};

export default function ClientOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const isFocused = useIsFocused();

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    }
  };

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused]);

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
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const { product, quantity, price } = item;
    const outOfStock = product.stock_quantity <= 0;

    return (
      <View style={styles.itemContainer}>
        {product.images?.[0] && (
          <Image
            source={{
              uri: `http://192.168.0.79:8000/storage/${product.images[0].image_path}`,
            }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{product.name}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {product.description}
          </Text>
          <Text style={styles.itemPrice}>
            Preço unitário: R$ {Number(price).toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.itemQuantity}>Quantidade: {quantity}</Text>
          {outOfStock && (
            <Text style={styles.itemOutOfStock}>Esgotado</Text>
          )}
        </View>
      </View>
    );
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderContainer}>
      <Text style={styles.orderHeader}>
        Pedido: {item.code} | Status: {getStatusLabel(item.status)}{'\n'}
        Loja: {item.store.final_name}{'\n'}
        Data do pedido: {new Date(item.created_at).toLocaleString()}
      </Text>

      <FlatList
        data={item.items}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderOrderItem}
      />

      <Text style={styles.orderTotal}>
        Total: R$ {Number(item.total).toFixed(2).replace('.', ',')}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Meus Pedidos</Text>

        {orders.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  orderContainer: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  orderHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  itemImage: {
    width: 100,
    height: '100%',
  },
  itemContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
  },
  itemPrice: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#444',
  },
  itemOutOfStock: {
    fontSize: 13,
    color: '#e11d48',
    fontWeight: '700',
  },
});