import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export const nfcService = {
  // Inicializar el hardware NFC
  init: async () => {
    try {
      await NfcManager.start();
    } catch (ex) {
      console.warn('El dispositivo no soporta NFC o está desactivado', ex);
    }
  },

  // Verificar disponibilidad
  isSupported: async () => {
    return await NfcManager.isSupported();
  },

  // Escanear tarjeta física y retornar su UID
  readTagUid: async (): Promise<string | null> => {
    try {
      // Solicitamos acceso a tecnología Ndef / NfcA (estándar de tarjetas/stickers NFC)
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      
      if (tag && tag.id) {
        return tag.id; // UID único de la tarjeta (ej. 04A1B2C3D4E5F6)
      }
      return null;
    } catch (ex) {
      console.warn('Escaneo NFC cancelado o con error:', ex);
      return null;
    } finally {
      // Detener el listener para no agotar la batería
      NfcManager.cancelTechnologyRequest();
    }
  },

  // Cancelar escaneo activo
  cancelScan: async () => {
    await NfcManager.cancelTechnologyRequest();
  }
};