import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../api/client';
import { parseApiError } from '../api/errors';
import { CardView, elementColor, fromCatalog, rarityColor } from '../components/CardView';
import { RootStackParamList } from '../navigation/types';
import { CollectionCard, CollectionResponse, CollectionSummary, RARITY_LABEL, Rarity } from '../types/cards';

// ARK-016: colección. Muestra todo el catálogo: las cartas que ya vinculaste a tu cuenta (escaneando
// su chip NFC) se ven completas y las demás aparecen bloqueadas. Persiste en tu cuenta.
const LockedCard = ({ card }: { card: CollectionCard }) => (
  <View style={[styles.locked, { borderColor: elementColor(card.element) }]}>
    <Text style={styles.lockedName} numberOfLines={1}>
      🔒 {card.name}
    </Text>
    <Text style={[styles.lockedMeta, { color: rarityColor(card.rarity) }]}>
      {card.element}
      {card.rarity ? ` · ${RARITY_LABEL[card.rarity as Rarity] ?? card.rarity}` : ''}
    </Text>
    <Text style={styles.lockedHint}>Escanea su chip para desbloquearla</Text>
  </View>
);

export const GalleryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [summary, setSummary] = useState<CollectionSummary>({ total: 0, unlocked: 0 });
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get<CollectionResponse>('/cards/collection');
      setCards(data.cards);
      setSummary(data.summary);
      setError(null);
    } catch (e: any) {
      setError(parseApiError (e));
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

  const visible = onlyUnlocked ? cards.filter(c => c.unlocked) : cards;
  const ratio = summary.total > 0 ? summary.unlocked / summary.total : 0;
  const widthPct = `${Math.round(ratio * 100)}%` as `${number}%`;

  return (
    <View style={styles.root}>
      <FlatList
        data={visible}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#e94560" />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.counter}>
              {summary.unlocked} de {summary.total} cartas vinculadas
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: widthPct }]} />
            </View>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, !onlyUnlocked && styles.tabOn]}
                onPress={() => setOnlyUnlocked(false)}
              >
                <Text style={[styles.tabText, !onlyUnlocked && styles.tabTextOn]}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, onlyUnlocked && styles.tabOn]}
                onPress={() => setOnlyUnlocked(true)}
              >
                <Text style={[styles.tabText, onlyUnlocked && styles.tabTextOn]}>Vinculadas</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {error ??
              (onlyUnlocked
                ? 'Aún no has vinculado ninguna carta.\nEscanea una carta física para desbloquearla.'
                : 'No hay cartas en el catálogo.')}
          </Text>
        }
        renderItem={({ item }) =>
          item.unlocked ? (
            <CardView card={fromCatalog(item)} style={styles.card} />
          ) : (
            <LockedCard card={item} />
          )
        }
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
  header: { marginBottom: 12 },
  counter: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  track: { height: 8, backgroundColor: '#0f3460', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#e94560' },
  tabs: { flexDirection: 'row', marginTop: 12 },
  tab: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  tabOn: { backgroundColor: '#e94560', borderColor: '#e94560' },
  tabText: { color: '#8d99ae', fontSize: 14, fontWeight: '600' },
  tabTextOn: { color: '#fff' },
  empty: { color: '#8d99ae', fontSize: 15, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  card: { marginBottom: 12 },
  locked: {
    backgroundColor: '#12182b',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 12,
    marginBottom: 12,
    opacity: 0.7,
  },
  lockedName: { color: '#8d99ae', fontSize: 18, fontWeight: 'bold' },
  lockedMeta: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  lockedHint: { color: '#8d99ae', fontSize: 12, marginTop: 6 },
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
