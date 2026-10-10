import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiClient } from '../../api/client';
import { CardLike, CardView } from '../../components/CardView';
import { cancelScan, normalizeUid, readTagUid } from '../../services/nfcReader';
import { InventoryCard, MatchView } from '../../types/match';

interface Props {
  view: MatchView;
  opponentName: string;
  errorKey: number;
  onSubmit: (nfcUids: string[]) => void;
  onLeave: () => void;
}

const toCardLike = (c: InventoryCard): CardLike => ({
  name: c.name,
  element: String(c.element).toUpperCase(),
  hp: Number(c.hp),
  maxHp: Number(c.hp),
  attack: Number(c.attack),
  manaCost: Number(c.mana_cost),
});

export const PicksPhase = ({ view, opponentName, errorKey, onSubmit, onLeave }: Props) => {
  const deckSize = view.deckSize;
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [picks, setPicks] = useState<InventoryCard[]>([]);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.get('/cards/inventory');
        setInventory(response.data);
      } catch (error) {
        console.error('Error cargando inventario:', error);
        Alert.alert('Error', 'No se pudo cargar tu colección.');
      } finally {
        setLoadingInventory(false);
      }
    })();
    return () => {
      cancelScan();
    };
  }, []);

  // Si el servidor rechazó la confirmación, se puede volver a intentar
  useEffect(() => {
    if (errorKey) setSubmitting(false);
  }, [errorKey]);

  const handleScan = async () => {
    if (picks.length >= deckSize) {
      Alert.alert('Mazo completo', `Solo puedes usar ${deckSize} cartas en la partida.`);
      return;
    }
    cancelledRef.current = false;
    setScanning(true);
    try {
      const uid = normalizeUid(await readTagUid());
      const card = inventory.find((c) => normalizeUid(c.nfc_uid) === uid);

      if (!card) {
        Alert.alert(
          'Tarjeta no reconocida',
          'Esta tarjeta no está en tu colección. Regístrala primero en la pestaña Colección.',
        );
        return;
      }
      if (picks.some((p) => p.physical_card_id === card.physical_card_id)) {
        Alert.alert('Carta repetida', `${card.name} ya está en tu selección.`);
        return;
      }
      setPicks((prev) => [...prev, card]);
    } catch (error: any) {
      if (!cancelledRef.current) {
        Alert.alert('No se pudo leer la tarjeta', error?.message ?? 'Inténtalo de nuevo.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleCancelScan = async () => {
    cancelledRef.current = true;
    await cancelScan();
  };

  const removePick = (id: string) => {
    setPicks((prev) => prev.filter((p) => p.physical_card_id !== id));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    onSubmit(picks.map((p) => normalizeUid(p.nfc_uid)));
  };

  /* Ya confirmaste: esperando al rival */
  if (view.me.picksReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>¡Mazo confirmado!</Text>
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
        <Text style={styles.subtitle}>Esperando a que {opponentName} elija sus cartas...</Text>
        <View style={styles.waitingList}>
          {(view.me.cards ?? []).map((c) => (
            <CardView key={c.physicalCardId} card={c} compact style={styles.waitingCard} />
          ))}
        </View>
        <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
          <Text style={styles.leaveText}>Abandonar partida</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const full = picks.length >= deckSize;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Elige tus {deckSize} cartas</Text>
      <Text style={styles.subtitle}>
        Contra {opponentName}
        {view.opponent?.picksReady ? '  ·  ✅ ya eligió' : '  ·  eligiendo...'}
      </Text>

      {loadingInventory ? (
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
      ) : (
        <>
          {Array.from({ length: deckSize }).map((_, i) => {
            const pick = picks[i];
            if (!pick) {
              return (
                <View key={`slot-${i}`} style={styles.emptySlot}>
                  <Text style={styles.emptyText}>Carta {i + 1} · vacía</Text>
                </View>
              );
            }
            return (
              <View key={pick.physical_card_id} style={styles.pickRow}>
                <Text style={styles.slotNumber}>{i + 1}</Text>
                <CardView card={toCardLike(pick)} compact style={styles.pickCard} />
                <TouchableOpacity onPress={() => removePick(pick.physical_card_id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {scanning ? (
            <TouchableOpacity style={[styles.scanBtn, styles.scanActive]} onPress={handleCancelScan}>
              <Text style={styles.scanText}>📡 Acerca la tarjeta al celular...</Text>
              <Text style={styles.scanHint}>Toca para cancelar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, full && styles.btnDisabled]}
              onPress={handleScan}
              disabled={full}
            >
              <Text style={styles.scanText}>
                {full ? `Máximo ${deckSize} cartas` : '📡 Escanear carta NFC'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (!full || submitting) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!full || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>
                Confirmar mazo ({picks.length}/{deckSize})
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
        <Text style={styles.leaveText}>Abandonar partida</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#8d99ae', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  loader: { marginVertical: 24 },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3a4a6b',
    borderRadius: 10,
    paddingVertical: 18,
    marginBottom: 10,
    alignItems: 'center',
  },
  emptyText: { color: '#5c6b8a', fontSize: 13 },
  pickRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  slotNumber: { color: '#8d99ae', fontWeight: 'bold', width: 22, textAlign: 'center' },
  pickCard: { flex: 1, marginHorizontal: 6 },
  removeBtn: { padding: 8 },
  removeText: { color: '#e63946', fontSize: 18, fontWeight: 'bold' },
  scanBtn: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  scanActive: { backgroundColor: '#3a1c2b' },
  scanText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanHint: { color: '#8d99ae', fontSize: 12, marginTop: 4 },
  confirmBtn: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.4 },
  waitingList: { flexDirection: 'row', marginTop: 24, width: '100%' },
  waitingCard: { flex: 1, marginHorizontal: 2 },
  leaveBtn: { marginTop: 24, alignItems: 'center', padding: 8 },
  leaveText: { color: '#e63946', fontSize: 14 },
});