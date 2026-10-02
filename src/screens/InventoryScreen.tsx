import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ColorValue,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
const getElementColor = (element: string): ColorValue => {
  switch (element) {
    case 'FUEGO':
      return '#e63946';
    case 'AGUA':
      return '#457b9d';
    case 'PLANTA':
      return '#2a9d8f';
    case 'TIERRA':
      return '#e9c46a';
    case 'AIRE':
      return '#a8dadc';
    default:
      return '#6c757d';
  }
};

interface PhysicalCard {
  physical_card_id: string;
  nfc_uid: string;
  card_id: number;
  name: string;
  element: string;
  hp: number;
  mana_cost: number;
  attack: number;
  rarity: string;
}

export const InventoryScreen = () => {
  const [cards, setCards] = useState<PhysicalCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchInventory = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiClient.get('/cards/inventory');
      setCards(response.data);
    } catch (error: any) {
      console.error('Error cargando inventario:', error);
      Alert.alert('Error', 'No se pudo obtener tu inventario de cartas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Se recarga cada vez que la pestaña recibe el foco
  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, []),
  );

  const renderCardItem = ({ item }: { item: PhysicalCard }) => (
    <View style={[styles.cardContainer, { borderColor: getElementColor(item.element) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={[styles.badgeContainer, { backgroundColor: getElementColor(item.element) }]}>
          <Text style={styles.badgeText}>{item.element}</Text>
        </View>
      </View>
      <View style={styles.cardStats}>
        <Text style={styles.statText}>⚔️ ATK: {item.attack}</Text>
        <Text style={styles.statText}>❤️ HP: {item.hp}</Text>
        <Text style={styles.statText}>🧪 Maná: {item.mana_cost}</Text>
      </View>
      <Text style={styles.uidText}>NFC: {item.nfc_uid}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tus Cartas Reclamadas ({cards.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NfcScan')} style={styles.logoutButton}>
        <Text style={styles.logoutText}>+ Carta</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.physical_card_id}
          renderItem={renderCardItem}
          refreshing={refreshing}
          onRefresh={() => fetchInventory(true)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No has escaneado tarjetas NFC aún.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  logoutButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 20 },
  cardContainer: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  badgeContainer: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statText: { color: '#bdc3c7', fontSize: 14 },
  uidText: { color: '#7f8c8d', fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  emptyText: { color: '#8d99ae', textAlign: 'center', marginTop: 40, fontSize: 16 },
});