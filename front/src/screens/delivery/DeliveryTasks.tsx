import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Text } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
 
export default function DeliveryTasks() {
    const { user } = useAuth();

    return (
        <LayoutWithSidebar>
            <Text fontSize="xl">Bem-vindo(a), {user?.name} (Entregador)</Text>
        </LayoutWithSidebar>
    );
}