import { Home, ShoppingCart, Truck, User } from 'lucide-react-native';

export const sidebarOptions: Record<string, { label: string; screen: string; icon: any }[]> = {
    client: [
        { label: 'Meus Pedidos', screen: 'ClientOrders', icon: ShoppingCart },
        { label: 'Perfil', screen: 'ClientProfile', icon: User }
    ],
    store: [
        { label: 'Produtos', screen: 'StoreProducts', icon: ShoppingCart },
        { label: 'Pedidos Recebidos', screen: 'StoreOrders', icon: Truck }
    ],
    delivery: [
        { label: 'Entregas', screen: 'DeliveryTasks', icon: Truck },
        { label: 'Perfil', screen: 'DeliveryProfile', icon: User }
    ],
    admin: [
        { label: 'Painel', screen: 'AdminDashboard', icon: Home },
        { label: 'Usuários', screen: 'ManageUsers', icon: User }
    ]
};