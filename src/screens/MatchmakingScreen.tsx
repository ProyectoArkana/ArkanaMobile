import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../navigation/types';
import { SOCKET_URL } from '../api/config';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Matchmaking'>;

interface MatchFoundPayload {
  matchId: string;
  opponent: { userId: string | number; username: string };
}

export const MatchmakingScreen = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<string>('Conectando al servidor...');
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id;
  const username = user?.username;

  useEffect(() => {
    if (userId === undefined || userId === null || !username) {
      setStatus('No hay sesión de usuario.\nCierra sesión y vuelve a iniciar.');
      return;
    }

    console.log('🔎 Matchmaking → conectando a', SOCKET_URL, 'como', username);
    const socket = io(SOCKET_URL, { timeout: 5000, reconnectionAttempts: 5 });
    socketRef.current = socket;

    // Conexión exitosa (también se dispara tras una reconexión)
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor de Matchmaking:', socket.id);
      setStatus('Buscando oponente...');
      socket.emit('join_queue', { userId, username });
    });

    // El servidor confirma que estamos en la cola
    socket.on('queue_joined', (data: { playersInQueue: number }) => {
      setStatus(`Buscando oponente...\nJugadores en cola: ${data.playersInQueue}`);
    });

    // El servidor rechazó la búsqueda (por ejemplo, cuenta duplicada)
    socket.on('queue_error', (data: { message: string }) => {
      setStatus(data.message);
      socket.disconnect();
    });

    // ¡Oponente encontrado!
    socket.on('match_found', (data: MatchFoundPayload) => {
      console.log('⚔️ Partida encontrada:', data.matchId);
      setStatus(`¡Partida encontrada!\nVS ${data.opponent.username}`);
      socket.disconnect();

      timeoutRef.current = setTimeout(() => {
        navigation.replace('MatchScreen', {
          matchId: data.matchId,
          opponent: data.opponent,
        });
      }, 1500);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ connect_error:', error.message);
      setStatus(`No se pudo conectar al servidor.\n${error.message}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ Socket desconectado:', reason);
    });

    // Limpieza: al salir de la pantalla se cancela la búsqueda
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, username, navigation]);

  const handleCancel = () => {
    socketRef.current?.disconnect();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.radarContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.serverText}>Servidor: {SOCKET_URL}</Text>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancelar Búsqueda</Text>
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
    padding: 20,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  serverText: {
    color: '#7f8c8d',
    fontSize: 11,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#16213e',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e63946',
    marginBottom: 40,
  },
  cancelText: { color: '#e63946', fontSize: 16, fontWeight: 'bold' },
});