import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Text } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

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

type CartItem = {
    product: Product;
    quantity: number;
}
 
export default function ClientCart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const fetchCart = async () => {
        try {
            const token = await AsyncStorage.getItem('@token');
            const res = await api.get('/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(res.data.items || []);
        } catch (err) {

        }
    }

    return (
        <LayoutWithSidebar>
            <Text fontSize="xl">Bem-vindo(a), {user?.name} (Cliente)</Text>
        </LayoutWithSidebar>
    );
}