import React from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { Center, NativeBaseProvider, Spinner } from 'native-base';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppRoutes from './src/navigation/AppRoutes';

function Main() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Center flex={1}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <NavigationContainer>
      <AppRoutes />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <NativeBaseProvider>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </NativeBaseProvider>
  );
}