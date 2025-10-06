import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawerContent from "./CustomDrawerContent";
import ClientDashboard from "../screens/client/ClientDashboard";
import { useAuth } from "../contexts/AuthContext";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const { user } = useAuth();
  const role = user?.role || "client";

  const screens: Record<string, { name: string; component: any }[]> = {
    client: [
      { name: "ClientDashboard", component: ClientDashboard }
    ],
  };

  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      {screens[role]?.map((s) => (
        <Drawer.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Drawer.Navigator>
  );
}