import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { nfcService } from '../services/nfcService';
import { apiClient } from '../api/client';

export const NfcScanScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedUid, setScannedUid] = useState<string | null>(null);

  useEffect(() => {
    nfcService.init();
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    setScannedUid(null);

    const uid = await nfcService.readTagUid();
    setScanning(false);

    if (uid) {
      setScannedUid(uid);
      // Vincular tarjeta con el ID de carta #1 del catálogo (ejemplo)
      await claimCardToBackend(uid, 1);
    }
  };

  const claimCardToBackend = async (nfcUid: string, cardId: number) => {
    try {
      const response = await apiClient.post('/cards/nfc/claim', {
        nfc_uid: nfcUid,
        card_id: cardId,
      });

      Alert.alert('¡Éxito!', response.data.message || 'Carta vinculada a tu inventario');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'No se pudo vincular la tarjeta';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lector de Cartas Arkana</Text>
      
      {scanning ? (
        <View style={styles.scanningBox}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.infoText}>Acerca tu tarjeta NFC al reverso del celular...</Text>
          <Button title="Cancelar" onPress={() => nfcService.cancelScan()} color="red" />
        </View>
      ) : (
        <Button title="Escanear Tarjeta Física" onPress={handleStartScan} />
      )}

      {scannedUid && (
        <Text style={styles.resultText}>Último UID detectado: {scannedUid}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  scanningBox: { alignItems: 'center', gap: 10 },
  infoText: { marginVertical: 15, fontSize: 16, textAlign: 'center' },
  resultText: { marginTop: 20, fontSize: 14, color: 'green', fontWeight: '600' }
});