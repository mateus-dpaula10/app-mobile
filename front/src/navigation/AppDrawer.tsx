import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawerContent from "./CustomDrawerContent";
import { useAuth } from "../contexts/AuthContext";
import ManageUsers from "../screens/admin/ManageUsers";
import StoreProducts from "../screens/store/StoreProducts";
import StoreProfile from "../screens/store/StoreProfile";
import CustomerStores from "../screens/client/CustomerStores";
import CustomerStoresProducts from "../screens/client/CustomerStoresProducts";
import ClientCart from "../screens/client/ClientCart";
import ClientOrders from "../screens/client/ClientOrders";
import ClientProfile from "../screens/client/ClientProfile";
import StoreOrders from "../screens/store/StoreOrders";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const { user } = useAuth();
  const role = user?.role || "client";

  const screens: Record<string, { name: string; component: any }[]> = {
    admin: [
      { name: "ManageUsers", component: ManageUsers }
    ],
    store: [
      { name: "StoreProducts", component: StoreProducts },
      { name: "StoreProfile", component: StoreProfile },
      { name: "StoreOrders", component: StoreOrders },
    ],
    client: [
      { name: "CustomerStores", component: CustomerStores },
      { name: "CustomerStoresProducts", component: CustomerStoresProducts },
      { name: "ClientCart", component: ClientCart },
      { name: "ClientOrders", component: ClientOrders },
      { name: "ClientProfile", component: ClientProfile },
    ]
  };

  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      {screens[role]?.map((s) => (
        <Drawer.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Drawer.Navigator>
  );
}