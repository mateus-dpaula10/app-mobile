import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawerContent from "./CustomDrawerContent";
import { useAuth } from "../contexts/AuthContext";
import ManageUsers from "../screens/admin/ManageUsers";
import StoreProducts from "../screens/store/StoreProducts";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const { user } = useAuth();
  const role = user?.role || "client";

  const screens: Record<string, { name: string; component: any }[]> = {
    admin: [
      { name: "ManageUsers", component: ManageUsers }
    ],
    store: [
      { name: "StoreProducts", component: StoreProducts }
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