import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/useAuthStore';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { NfcScanScreen } from '../screens/NfcScanScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MatchmakingScreen } from '../screens/MatchmakingScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { RootStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon = (emoji: string) => () => <Text style={styles.tabIcon}>{emoji}</Text>;

// Pestañas inferiores: Colección (izq) | Arena (centro) | Perfil (der)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Arena"
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#0f3460' },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#8d99ae',
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Mi Inventario', tabBarLabel: 'Colección', tabBarIcon: tabIcon('🃏') }}
      />
      <Tab.Screen
        name="Arena"
        component={ArenaScreen}
        options={{ title: 'Arena', tabBarLabel: 'Arena', tabBarIcon: tabIcon('⚔️') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil', tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {/* El Tab Navigator principal */}
            <Stack.Screen name="Main" component={MainTabNavigator} />

            {/* Pantallas superpuestas (no muestran la barra inferior) */}
            <Stack.Screen
              name="NfcScan"
              component={NfcScanScreen}
              options={{
                headerShown: true,
                title: 'Registrar carta',
                headerStyle: { backgroundColor: '#1a1a2e' },
                headerTintColor: '#fff',
              }}
            />

            {/* Búsqueda de oponente */}
            <Stack.Screen
              name="Matchmaking"
              component={MatchmakingScreen}
              options={{
                headerShown: false, // Sin header para que se vea inmersiva
                animation: 'fade', // Transición suave al entrar
              }}
            />

            {/* Tablero de la partida (se abre al encontrar oponente) */}
            <Stack.Screen
              name="MatchScreen"
              component={MatchScreen}
              options={{
                headerShown: false,
                gestureEnabled: false, // Evita salir de la partida con el gesto atrás
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  tabIcon: { fontSize: 20 },
});