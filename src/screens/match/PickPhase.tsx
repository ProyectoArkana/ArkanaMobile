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
import { errorMessage } from '../../api/errors';
import { CardLike, CardView, fromCatalog } from '../../components/CardView';
import { cancelScan, normalizeUid, readTagUid } from '../../services/nfcReader';
import { CatalogCard } from '../../types/cards';
import { MatchView } from '../../types/match';

interface Props {
  view: MatchView;
  opponentName: string;
  errorKey: number;
  onSubmit: (nfcIds: string[]) => void;
  onLeave: () => void;
}

// Una carta ya escaneada y validada por el servidor (el chip existe y es una carta real)
interface Pick {
  nfcId: string;
  card: CardLike;
}

export const PicksPhase = ({ view, opponentName, errorKey, onSubmit, onLeave }: Props) => {
  const deckSize = view.deckSize;
  const [picks, setPicks] = useState<Pick[]>([]);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelScan();
    };
  }, []);

  // Si el servidor rechazó la confirmación, se puede volver a intentar
  useEffect(() => {
    if (errorKey) setSubmitting(false);
  }, [errorKey]);

  // No hay "dueño": cualquier carta real sirve, también la que te prestaron.
  // El servidor valida el chip, nos devuelve sus atributos y la desbloquea en tu galería.
  const handleScan = async () => {
    if (picks.length >= deckSize) {
      Alert.alert('Equipo completo', `Solo puedes usar ${deckSize} cartas en la partida.`);
      return;
    }
    cancelledRef.current = false;
    setScanning(true);
    try {
      const nfcId = normalizeUid(await readTagUid());

      if (picks.some((p) => p.nfcId === nfcId)) {
        Alert.alert('Carta repetida', 'Esa carta física ya está en tu equipo.');
        return;
      }

      const { data } = await apiClient.post<{ card: CatalogCard }>('/cards/scan', { nfc_id: nfcId });
      setPicks((prev) => [...prev, { nfcId, card: fromCatalog(data.card) }]);
    } catch (error: any) {
      if (!cancelledRef.current) {
        Alert.alert('No se pudo usar la tarjeta', errorMessage(error, error?.message ?? 'Inténtalo de nuevo.'));
      }
    } finally {
      setScanning(false);
    }
  };

  const handleCancelScan = async () => {
    cancelledRef.current = true;
    await cancelScan();
  };

  const removePick = (nfcId: string) => {
    setPicks((prev) => prev.filter((p) => p.nfcId !== nfcId));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    onSubmit(picks.map((p) => p.nfcId));
  };

  /* Ya confirmaste: esperando al rival */
  if (view.me.picksReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>¡Mazo confirmado!</Text>
        <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
        <Text style={styles.subtitle}>Esperando a que {opponentName} elija sus cartas...</Text>
        <View style={styles.waitingList}>
          {(view.me.cards ?? []).map((c, i) => (
            <CardView key={`${c.cardId}-${i}`} card={c} compact style={styles.waitingCard} />
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

      {
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
              <View key={pick.nfcId} style={styles.pickRow}>
                <Text style={styles.slotNumber}>{i + 1}</Text>
                <CardView card={pick.card} compact style={styles.pickCard} />
                <TouchableOpacity onPress={() => removePick(pick.nfcId)} style={styles.removeBtn}>
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
      }

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