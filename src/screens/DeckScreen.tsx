import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { parseApiError  } from '../api/errors';
import { CardView, elementColor, fromCatalog } from '../components/CardView';
import { GalleryCard } from '../types/cards';
import {
  ActiveDeckResponse,
  DECK_SIZE,
  DeckError,
  ValidateDeckResponse,
  validateDeckLocally,
} from '../types/decks';

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((id, i) => id === b[i]);

// ARK-020: seleccionar y validar el mazo activo (5 cartas distintas de tu colección).
// Mientras eliges, el servidor valida el mazo completo; "Guardar" solo se habilita si es válido.
export const DeckScreen = () => {
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [valid, setValid] = useState(false);
  const [errors, setErrors] = useState<DeckError[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        apiClient.get<{ cards: GalleryCard[] }>('/cards/gallery'),
        apiClient.get<ActiveDeckResponse>('/decks/active'),
      ])
        .then(([gallery, deck]) => {
          if (!active) return;
          const ids = (deck.data.deck?.cards ?? []).map(c => c.id);
          setCards(gallery.data.cards);
          setSelected(ids);
          setSavedIds(ids);
          setLoadError(null);
        })
        .catch((e: any) => {
          if (active) setLoadError(parseApiError (e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // Validación en el servidor cada vez que el mazo tiene 5 cartas distintas
  useEffect(() => {
    let active = true;
    setValid(false);
    setErrors([]);
    setChecking(false);

    if (selected.length === DECK_SIZE && validateDeckLocally(selected).length === 0) {
      setChecking(true);
      apiClient
        .post<ValidateDeckResponse>('/decks/validate', { card_ids: selected })
        .then(({ data }) => {
          if (!active) return;
          setValid(data.valid);
          setErrors(data.errors);
        })
        .catch((e: any) => {
          if (active) setErrors([{ code: 'NETWORK', message: parseApiError (e) }]);
        })
        .finally(() => {
          if (active) setChecking(false);
        });
    }

    return () => {
      active = false;
    };
  }, [selected]);

  const toggle = (id: number) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= DECK_SIZE ? prev : [...prev, id],
    );

  const save = async () => {
    try {
      setSaving(true);
      await apiClient.put('/decks/active', { card_ids: selected });
      setSavedIds(selected);
      Alert.alert('Mazo guardado', 'Tu mazo activo se actualizó.');
    } catch (e: any) {
      const serverErrors = e?.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        setErrors(serverErrors);
        setValid(false);
      }
      Alert.alert('No se pudo guardar', parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const clear = () =>
    Alert.alert('Quitar mazo', '¿Quitar tu mazo activo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/decks/active');
            setSelected([]);
            setSavedIds([]);
          } catch (e: any) {
            Alert.alert('Error', parseApiError (e));
          }
        },
      },
    ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  const full = selected.length >= DECK_SIZE;
  const dirty = !sameIds(selected, savedIds);
  const canSave = valid && !checking && !saving && dirty;
  const slots = Array.from({ length: DECK_SIZE }, (_, i) => cards.find(c => c.id === selected[i]));

  return (
    <View style={styles.root}>
      <FlatList
        data={cards}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>
              Mazo activo ({selected.length}/{DECK_SIZE})
            </Text>

            <View style={styles.slots}>
              {slots.map((card, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.slot, card && { borderColor: elementColor(card.element) }]}
                  disabled={!card}
                  onPress={() => card && toggle(card.id)}
                >
                  <Text style={styles.slotText} numberOfLines={2}>
                    {card ? card.name : `${i + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selected.length < DECK_SIZE && (
              <Text style={styles.hint}>Selecciona {DECK_SIZE} cartas de tu colección.</Text>
            )}
            {checking && <Text style={styles.hint}>Validando mazo…</Text>}
            {valid && <Text style={styles.ok}>✔ Mazo válido{dirty ? '' : ' (es tu mazo activo)'}</Text>}
            {errors.map((e, i) => (
              <Text key={`${e.code}-${i}`} style={styles.error}>
                ✖ {e.message}
              </Text>
            ))}
            {savedIds.length > 0 && (
              <TouchableOpacity onPress={clear}>
                <Text style={styles.clear}>Quitar mazo activo</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadError ?? 'Aún no tienes cartas vinculadas.\nEscanea cartas físicas para armar tu mazo.'}
          </Text>
        }
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <CardView
              card={fromCatalog(item)}
              style={styles.card}
              selected={isSelected}
              disabled={full && !isSelected}
              onPress={() => toggle(item.id)}
            />
          );
        }}
      />

      <TouchableOpacity style={[styles.fab, !canSave && styles.fabDisabled]} disabled={!canSave} onPress={save}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.fabText}>Guardar mazo</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 96 },
  header: { marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  slots: { flexDirection: 'row', marginBottom: 10 },
  slot: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginRight: 6,
  },
  slotText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  hint: { color: '#8d99ae', fontSize: 13, marginTop: 4 },
  ok: { color: '#2a9d8f', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  error: { color: '#e63946', fontSize: 13, marginTop: 4 },
  clear: { color: '#e94560', fontSize: 13, fontWeight: '600', marginTop: 10 },
  empty: { color: '#8d99ae', fontSize: 15, textAlign: 'center', marginTop: 40, lineHeight: 22 },
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
  fabDisabled: { opacity: 0.4 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
