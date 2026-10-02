import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export const ArenaScreen = () => {
  const handleStartMatch = () => {
    // TODO: conectar con matchmaking-service y luego pasar a la fase de escaneo
    Alert.alert('Próximamente', 'El matchmaking se conectará cuando el servicio esté listo.');
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
  subtitle: { color: '#8d99ae', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 40 },
  playButton: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 48,
    elevation: 6,
  },
  playText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});