import NfcManager, { NfcTech } from 'react-native-nfc-manager';

let started = false;

// Deja solo hexadecimales en mayúsculas, para comparar UIDs sin importar el formato
export const normalizeUid = (uid: string): string =>
  String(uid ?? '').replace(/[^0-9a-f]/gi, '').toUpperCase();

// Espera a que el usuario acerque una tarjeta y devuelve su UID
export async function readTagUid(): Promise<string> {
  if (!(await NfcManager.isSupported())) {
    throw new Error('Este celular no tiene NFC.');
  }
  if (!started) {
    await NfcManager.start();
    started = true;
  }

  let enabled = true;
  try {
    enabled = await NfcManager.isEnabled();
  } catch {
    // En iOS no existe esta comprobación
  }
  if (!enabled) throw new Error('El NFC está desactivado. Actívalo en los ajustes del celular.');

  try {
    await NfcManager.requestTechnology([NfcTech.NfcA, NfcTech.Ndef]);
    const tag = await NfcManager.getTag();
    if (!tag?.id) throw new Error('No se pudo leer el identificador de la tarjeta.');
    return tag.id;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export const cancelScan = (): Promise<void> =>
  NfcManager.cancelTechnologyRequest().catch(() => {});