import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const ArenaScreen = () => {
  // Inicializamos la navegación con el tipado estricto de tus rutas
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleStartMatch = () => {
    console.log('⚔️ Botón Iniciar Partida presionado. Navegando a Matchmaking...');
    navigation.navigate('Matchmaking');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arena</Text>
      <Text style={styles.subtitle}>Prepara tus 5 cartas y desafía a otro jugador</Text>

      <TouchableOpacity style={styles.playButton} onPress={handleStartMatch}>
        <Text style={styles.playText}>Iniciar Partida</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  subtitle: { 
    color: '#8d99ae', 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 40 
  },
  playButton: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 48,
    elevation: 6, // Sombra para Android
    shadowColor: '#000', // Sombras para iOS
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});