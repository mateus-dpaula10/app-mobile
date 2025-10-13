import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, FlatList, Image, TouchableOpacity, 
  KeyboardAvoidingView, Platform, StyleSheet 
} from 'react-native';
import api from '../../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

type ProductImage = { id: number; product_id: number; image_path: string; };
type Product = { id: number; name: string; description: string; price: number; stock_quantity: number; company_id: number; images: ProductImage[]; };
type Store = { id: number; legal_name: string; final_name: string; cnpj: string; phone: string; address: string; plan: string; active: boolean; category: string; logo?: string; products: Product[]; };
type RootStackParamList = { CustomerStores: undefined; CustomerStoresProducts: { store: Store } };
type Props = NativeStackScreenProps<RootStackParamList, 'CustomerStores'>;

export default function CustomerStores({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { name: 'Supermercado', image: 'http://192.168.0.79:8000/storage/categories/supermercado.jpg' },
    { name: 'Padaria', image: 'http://192.168.0.79:8000/storage/categories/padaria.jpg' },
    { name: 'Restaurante', image: 'http://192.168.0.79:8000/storage/categories/restaurante.jpg' },
    { name: 'Bebidas', image: 'http://192.168.0.79:8000/storage/categories/bebidas.jpg' },
    { name: 'Doces e Sobremesas', image: 'http://192.168.0.79:8000/storage/categories/sobremesas.jpg' },
    { name: 'Farmácia', image: 'http://192.168.0.79:8000/storage/categories/farmacia.jpg' },
    { name: 'Pet Shop', image: 'http://192.168.0.79:8000/storage/categories/petshop.jpg' },
    { name: 'Moda e Acessórios', image: 'http://192.168.0.79:8000/storage/categories/moda.jpg' },
    { name: 'Eletrônicos', image: 'http://192.168.0.79:8000/storage/categories/eletronicos.jpg' },
    { name: 'Casa e Decoração', image: 'http://192.168.0.79:8000/storage/categories/casa_decoracao.jpg' },
    { name: 'Saúde e Beleza', image: 'http://192.168.0.79:8000/storage/categories/beleza.jpg' },
    { name: 'Esporte e Lazer', image: 'http://192.168.0.79:8000/storage/categories/esportes.jpg' },
    { name: 'Livraria', image: 'http://192.168.0.79:8000/storage/categories/livraria.jpg' },
  ];

  const fetchStores = async () => {
    try {
      const res = await api.get('/companies-with-products');
      setStores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchStores();
    }
  }, [isFocused]);

  const filteredStores = stores.filter(store => {
    const searchLower = search.toLowerCase();
    const matchesStoreName = store.final_name.toLowerCase().includes(searchLower);
    const matchesProductName = store.products.some(product =>
      product.name.toLowerCase().includes(searchLower)
    );
    const matchesCategory = !selectedCategory || store.category === selectedCategory;
    return (search === '' || matchesStoreName || matchesProductName) && matchesCategory;
  });

  function formatPhone(phone: string) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    if (cleaned.length === 10) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
    return phone;
  }

  const renderStoreCard = (store: Store) => (
    <View key={store.id} style={styles.storeCard}>
      {store.logo && <Image source={{ uri: `http://192.168.0.79:8000/storage/${store.logo.replace(/^\/+/, '')}` }} style={styles.storeLogo} />}
      <Text style={styles.storeName}>{store.final_name}</Text>
      {store.phone && <Text style={styles.storeInfo}>Telefone: {formatPhone(store.phone)}</Text>}
      {store.address && <Text style={styles.storeInfo}>Endereço: {store.address}</Text>}
      <TouchableOpacity style={styles.storeButton} onPress={() => navigation.navigate('CustomerStoresProducts', { store })}>
        <Text style={styles.storeButtonText}>Ver produtos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
        <FlatList
            style={{ padding: 16 }}
            data={filteredStores}
            keyExtractor={store => store.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            ListHeaderComponent={
                <>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>
                        Lojas disponíveis
                    </Text>

                    <TextInput
                        placeholder="Pesquisar loja ou produto"
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 6,
                            padding: 10,
                            marginVertical: 12,
                        }}
                        value={search}
                        onChangeText={setSearch}
                    />

                    <FlatList
                        data={categories}
                        keyExtractor={item => item.name}
                        numColumns={3} 
                        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                        scrollEnabled={false} 
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.categoryButton, selectedCategory === item.name && styles.categorySelected]}
                                onPress={() => setSelectedCategory(item.name === selectedCategory ? null : item.name)}
                            >
                                <Image source={{ uri: item.image }} style={styles.categoryImage} />
                                <Text style={styles.categoryText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </>
            }
            renderItem={({ item }) => renderStoreCard(item)}
            ListEmptyComponent={
                !loading ? (
                    <Text style={{ textAlign: 'center', marginTop: 40, color: 'gray' }}>
                        Selecione uma categoria ou busque uma loja
                    </Text>
                ) : null
            }
        />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  categoryButton: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  categorySelected: { borderWidth: 2, borderColor: 'blue', borderRadius: 8 },
  categoryImage: { width: 60, height: 60, borderRadius: 10 },
  categoryText: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  storeCard: { flex: 1, margin: 4, padding: 8, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  storeLogo: { width: 80, height: 80, borderRadius: 10 },
  storeName: { fontWeight: 'bold', fontSize: 16, marginTop: 8, textAlign: 'center' },
  storeInfo: { fontSize: 12, color: '#555', textAlign: 'center' },
  storeButton: { marginTop: 8, backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  storeButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});