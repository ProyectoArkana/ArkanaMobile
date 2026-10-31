import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiClient } from '../api/client';
import { parseApiError } from '../api/errors';
import { CardFilters } from '../components/CardFilters';
import { CardView, fromCatalog } from '../components/CardView';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  CardFiltersState,
  CatalogCard,
  EMPTY_FILTERS,
  countActiveFilters,
  filtersToParams,
} from '../types/cards';

// ARK-008 + ARK-009: búsqueda por nombre y filtros (elemento, rareza, ataque, defensa).
// Sin criterios muestra el catálogo completo.
export const CardSearchScreen = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CardFiltersState>(EMPTY_FILTERS);
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedName = useDebouncedValue(query.trim(), 350);
  const debouncedFilters = useDebouncedValue(filters, 350);
  const hasCriteria = debouncedName !== '' || countActiveFilters(debouncedFilters) > 0;

  useEffect(() => {
    // `active` descarta respuestas viejas si el usuario siguió cambiando los criterios
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {
      ...filtersToParams(debouncedFilters),
      ...(debouncedName ? { name: debouncedName } : {}),
    };

    apiClient
      .get<{ cards: CatalogCard[] }>('/cards', {
        params: Object.keys(params).length > 0 ? params : undefined,
      })
      .then(({ data }) => {
        if (!active) return;
        setCards(data.cards);
        setError(null);
      })
      .catch((e: any) => {
        if (!active) return;
        setCards([]);
        setError(parseApiError(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedName, debouncedFilters]);

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.input}
        placeholder="Buscar carta por nombre"
        placeholderTextColor="#8d99ae"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={cards}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <CardFilters value={filters} onChange={setFilters} />
            {loading ? (
              <ActivityIndicator size="small" color="#e94560" style={styles.loader} />
            ) : !error && cards.length > 0 ? (
              <Text style={styles.counter}>
                {cards.length} {cards.length === 1 ? 'carta' : 'cartas'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : (
            <Text style={styles.empty}>
              {error ??
                (hasCriteria ? 'No se encontraron cartas con esos criterios.' : 'No hay cartas en el catálogo.')}
            </Text>
          )
        }
        renderItem={({ item }) => <CardView card={fromCatalog(item)} style={styles.card} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 16,
    marginBottom: 4,
    fontSize: 16,
  },
  loader: { marginVertical: 12 },
  list: { padding: 16, paddingBottom: 32 },
  counter: { color: '#8d99ae', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  empty: { color: '#8d99ae', fontSize: 15, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  card: { marginBottom: 12 },
});
