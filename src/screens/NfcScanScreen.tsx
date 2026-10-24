import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../api/client';
import { errorMessage } from '../api/errors';
import { CardView, fromCatalog } from '../components/CardView';
import { cancelScan, normalizeUid, readTagUid } from '../services/nfcReader';
import { CatalogCard } from '../types/cards';

interface ScanResult {
  card: CatalogCard;
  newly_unlocked: boolean;
}

// Escanear una carta física: el servidor valida el chip (¿es una carta real de Arkana?),
// devuelve sus atributos y la desbloquea en tu galería. No hay dueños: sirve cualquier carta.
export const NfcScanScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelScan();
    };
  }, []);

  const handleScan = async () => {
    cancelledRef.current = false;
    setScanning(true);
    setResult(null);
    try {
      const nfcId = normalizeUid(await readTagUid());
      const { data } = await apiClient.post<ScanResult>('/cards/scan', { nfc_id: nfcId });
      setResult(data);
    } catch (error: any) {
      if (!cancelledRef.current) {
        Alert.alert('No se pudo escanear', errorMessage(error, error?.message ?? 'Inténtalo de nuevo.'));
      }
    } finally {
      setScanning(false);
    }
  };

  const handleCancel = async () => {
    cancelledRef.current = true;
    await cancelScan();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Escanear carta</Text>
      <Text style={styles.subtitle}>
        Acerca una carta física al reverso del celular. Se guardará en tu galería.
      </Text>

      {scanning ? (
        <View style={styles.scanningBox}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.info}>Acerca la tarjeta NFC...</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanText}>📡 Escanear carta</Text>
        </TouchableOpacity>
      )}

      {result && (
        <View style={styles.result}>
          <Text style={result.newly_unlocked ? styles.unlocked : styles.known}>
            {result.newly_unlocked ? '✨ ¡Carta nueva en tu galería!' : 'Ya tenías esta carta en tu galería'}
          </Text>
          <CardView card={fromCatalog(result.card)} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20, alignItems: 'stretch' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#8d99ae', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  scanBtn: { backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  scanText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  scanningBox: { alignItems: 'center', gap: 12 },
  info: { color: '#fff', fontSize: 16 },
  cancelBtn: { borderWidth: 1, borderColor: '#e63946', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
  cancelText: { color: '#e63946', fontWeight: 'bold' },
  result: { marginTop: 28 },
  unlocked: { color: '#e9c46a', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  known: { color: '#8d99ae', fontSize: 14, textAlign: 'center', marginBottom: 12 },
});
