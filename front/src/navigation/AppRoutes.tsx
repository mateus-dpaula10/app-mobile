import React, { useEffect, useState } from 'react'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import HomeClient from '../screens/HomeClient';
import HomeStore from '../screens/HomeStore';
import HomeDelivery from '../screens/HomeDelivery';
import HomeAdmin from '../screens/HomeAdmin';
import ClientOrders from '../screens/client/ClientOrders';
import ClientProfile from '../screens/client/ClientProfile';
import StoreProducts from '../screens/store/StoreProducts';
import StoreOrders from '../screens/store/StoreOrders';
import DeliveryTasks from '../screens/delivery/DeliveryTasks';
import DeliveryProfile from '../screens/delivery/DeliveryProfile';
import ManageUsers from '../screens/admin/ManageUsers';
import AdminDashboard from '../screens/admin/AdminDashboard';
import RegisterScreen from '../screens/RegisterScreen';
import CustomerStores from '../screens/client/CustomerStores';
import CustomerStoresProducts from '../screens/client/CustomerStoresProducts';
import ClientCart from '../screens/client/ClientCart';

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

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
    CustomerStores: undefined;
    CustomerStoresProducts: { store: Store };
    ClientOrders: undefined;
    ClientCart: undefined;
    ClientProfile: undefined;
    StoreProducts: undefined;
    StoreOrders: undefined;
    DeliveryTasks: undefined;
    DeliveryProfile: undefined;
    AdminDashboard: undefined;
    ManageUsers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppRoutes() {
    const { user, logout, loading } = useAuth();

    if (loading) return null;

    const HomeComponent = user?.role 
        ? {
            client: HomeClient,
            store: HomeStore,
            delivery: HomeDelivery,
            admin: HomeAdmin
        }[user.role]
        : null;

    useEffect(() => {
        if (user && !HomeComponent) logout();
    }, [user, HomeComponent]);

    if (!user || !HomeComponent) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeComponent} />

            {/* client */}
            <Stack.Screen name="CustomerStores" component={CustomerStores} />
            <Stack.Screen name="CustomerStoresProducts" component={CustomerStoresProducts} />
            <Stack.Screen name="ClientOrders" component={ClientOrders} />
            <Stack.Screen name="ClientProfile" component={ClientProfile} />
            <Stack.Screen name="ClientCart" component={ClientCart} />

            {/* store */}
            <Stack.Screen name="StoreProducts" component={StoreProducts} />
            <Stack.Screen name="StoreOrders" component={StoreOrders} />

            {/* delivery */}
            <Stack.Screen name="DeliveryTasks" component={DeliveryTasks} />
            <Stack.Screen name="DeliveryProfile" component={DeliveryProfile} />

            {/* admin */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="ManageUsers" component={ManageUsers} />
        </Stack.Navigator>
    );
}