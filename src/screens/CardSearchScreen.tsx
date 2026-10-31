import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { CardView } from '../components/CardView';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { CatalogCard } from '../types/cards';

export const CardSearchScreen = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350); 
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        // Si la búsqueda está vacía, trae el catálogo completo
        const url = debouncedQuery ? `/cards?name=${encodeURIComponent(debouncedQuery)}` : '/cards';
        const response = await apiClient.get(url);
        
        // Ajuste por si el backend devuelve { cards: [...] } o un arreglo directo
        const data = response.data.cards || response.data;
        setCards(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error(err);
        setError('No se pudieron cargar las cartas. Revisa tu conexión.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [debouncedQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar carta por nombre..."
          placeholderTextColor="#8d99ae"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id || item.name}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CardView
                card={{
                  name: item.name,
                  element: item.element,
                  hp: item.hp || 100, // Valor por defecto si no viene del backend
                  maxHp: item.maxHp || 100,
                  attack: item.attack,
                  manaCost: item.manaCost || 0,
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {debouncedQuery ? 'No se encontraron cartas con ese nombre.' : 'El catálogo está vacío.'}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  searchContainer: { marginBottom: 16 },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    fontSize: 16,
  },
  cardWrapper: { marginBottom: 12 },
  listContent: { paddingBottom: 24 },
  loader: { marginTop: 32 },
  errorText: { color: '#e94560', textAlign: 'center', marginBottom: 12 },
  emptyText: { color: '#8d99ae', textAlign: 'center', marginTop: 32, fontSize: 16 },
});