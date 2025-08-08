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

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
    const { user, logout } = useAuth();

    const HomeComponent = user?.role && {
        client: HomeClient,
        store: HomeStore,
        delivery: HomeDelivery,
        admin: HomeAdmin
    }[user.role];

    useEffect(() => {
        if (user && !HomeComponent) {
        logout();
        }
    }, [user, HomeComponent]);

    if (!user || !HomeComponent) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Navigator>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeComponent} />

            {/* client */}
            <Stack.Screen name="ClientOrders" component={ClientOrders} />
            <Stack.Screen name="ClientProfile" component={ClientProfile} />

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