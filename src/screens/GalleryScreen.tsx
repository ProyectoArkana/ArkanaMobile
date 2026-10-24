import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../api/client';
import { errorMessage } from '../api/errors';
import { CardView, fromCatalog } from '../components/CardView';
import { RootStackParamList } from '../navigation/types';
import { GalleryCard } from '../types/cards';

// Galería personal: las cartas que han pasado por tus manos (informativa; no hay "propiedad").
// Persiste en tu cuenta, así que la ves igual desde cualquier dispositivo.
export const GalleryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ cards: GalleryCard[] }>('/cards/gallery');
      setCards(data.cards);
      setError(null);
    } catch (e: any) {
      setError(errorMessage(e, 'No se pudo cargar tu galería.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Se recarga cada vez que vuelves a la pestaña (p. ej. tras escanear una carta)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={cards}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#e94560" />}
        ListHeaderComponent={
          <Text style={styles.counter}>
            {cards.length} {cards.length === 1 ? 'carta descubierta' : 'cartas descubiertas'}
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {error ?? 'Aún no has escaneado ninguna carta.\nEscanea una carta física para desbloquearla.'}
          </Text>
        }
        renderItem={({ item }) => <CardView card={fromCatalog(item)} style={styles.card} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NfcScan')}>
        <Text style={styles.fabText}>📡 Escanear carta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 96 },
  counter: { color: '#8d99ae', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  empty: { color: '#8d99ae', fontSize: 15, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  card: { marginBottom: 12 },
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
