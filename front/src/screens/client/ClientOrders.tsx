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
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useIsFocused } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';

type ProductImage = {
  id: number;
  product_id: number;
  image_path: string;
};

type ProductVariation = { id: number; type: string; value: string };

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  company_id: number;
  images: ProductImage[];
  variations: ProductVariation[];
};

type OrderItem = {
  id: number;
  product: Product;
  quantity: number;
  price: string | number;
  variations: ProductVariation[];
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
  const [selectedPayment, setSelectedPayment] = useState<Record<number, 'pix' | 'cash' | null>>({});
  const [pixCodes, setPixCodes] = useState<Record<number, { code: string; expiresAt: number }>>({});

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

  const getPixCode = async (orderId: number, orderCode: string) => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const response = await api.get(`/orders-driver/${orderId}/pix`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.pix_code) {
        setPixCodes(prev => ({
          ...prev,
          [orderId]: {
            code: response.data.pix_code,
            expiresAt: response.data.expira_em,
          },
        }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível gerar o código PIX');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      setPixCodes(prev => {
        const updated = { ...prev };
        for (const id in updated) {
          if (updated[id].expiresAt <= now) {
            delete updated[id];
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const handleSelectPayment = (orderId: number, method: 'pix' | 'cash', orderCode: string) => {
    setSelectedPayment(prev => ({ ...prev, [orderId]: method }));
    if (method === 'pix' && !pixCodes[orderId]) {
      getPixCode(orderId, orderCode);
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
      case 'ready_for_pickup':
        return 'pronto para retirada';
      default:
        return status;
    }
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const { product, quantity, price, variations } = item;
    const outOfStock = product.stock_quantity <= 0;

    const variationText = variations?.length 
      ? variations.map(v => `${v.type}: ${v.value}`).join(' | ')
      : null;

    return (
      <View style={styles.itemContainer}>
        {product.images?.[0] && (
          <Image
            source={{
              uri: `https://infrasonic-fibular-pat.ngrok-free.dev/storage/${product.images[0].image_path}`,
            }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{product.name}</Text>

          {variationText && (
            <Text style={styles.itemVariation}>
              {variationText}
            </Text>
          )}

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

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: selectedPayment[item.id] === 'cash' ? 'green' : '#ccc',
            borderRadius: 6,
            marginRight: 8,
          }}
          onPress={() => setSelectedPayment(prev => ({ ...prev, [item.id]: 'cash' }))}
        >
          <Text>💵 Retirada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: selectedPayment[item.id] === 'pix' ? 'green' : '#ccc',
            borderRadius: 6,
          }}
          onPress={() => handleSelectPayment(item.id, 'pix', item.code)}
        >
          <Text>📱 PIX</Text>
        </TouchableOpacity>
      </View>

      {selectedPayment[item.id] === 'pix' && pixCodes[item.id] && (
        <View style={{ marginTop: 36 }}>
          <Text style={{ marginBottom: 6 }}>Pague via PIX usando este QR Code:</Text>
          <QRCode value={pixCodes[item.id].code} size={180} />
          {(() => {
            const remaining = pixCodes[item.id].expiresAt - Math.floor(Date.now() / 1000);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            return remaining > 0 ? (
              <Text style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                Expira em {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
            ) : (
              <Text style={{ marginTop: 4, fontSize: 12, color: '#e11d48' }}>
                Código expirado
              </Text>
            );
          })()}
        </View>
      )}
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
  itemVariation: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontStyle: 'italic',
  },
});