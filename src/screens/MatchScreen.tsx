import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../navigation/types';
import { useMatchSocket } from '../hooks/useMatchSocket';
import { PicksPhase } from './match/PickPhase';
import { BattlePhase } from './match/BattlePhase';

export const MatchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MatchScreen'>>();
  const { matchId, opponent } = route.params;
  const user = useAuthStore((state) => state.user);

  const { view, connected, fatalError, error, clearError, submitPicks, sendAction, forfeit } = useMatchSocket(
    matchId,
    user?.username ?? 'Jugador',
  );

  const opponentName = view?.opponent?.username ?? opponent.username;

  // Vuelve al menú y limpia el historial para no poder regresar a la partida
  const exitToMenu = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [navigation]);

  // El botón "atrás" de Android no saca al jugador de la partida
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Los avisos de error desaparecen solos
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, 3500);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const confirmForfeit = () => {
    Alert.alert('Abandonar partida', 'Si abandonas, tu rival ganará. ¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abandonar', style: 'destructive', onPress: forfeit },
    ]);
  };

  let content: React.ReactNode;
  if (!view) {
    content = (
      <View style={styles.center}>
        {!fatalError && <ActivityIndicator size="large" color="#e94560" />}
        <Text style={styles.centerText}>{fatalError ?? 'Conectando con la partida...'}</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={exitToMenu}>
          <Text style={styles.menuBtnText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (view.status === 'PICKING') {
    content = (
      <PicksPhase
        view={view}
        opponentName={opponentName}
        errorKey={error?.key ?? 0}
        onSubmit={submitPicks}
        onLeave={confirmForfeit}
      />
    );
  } else {
    content = (
      <BattlePhase
        view={view}
        opponentName={opponentName}
        onAction={sendAction}
        onForfeit={forfeit}
        onExit={exitToMenu}
      />
    );
  }

  return (
    <View style={styles.root}>
      {content}
      {view && !connected && (
        <View style={[styles.toast, styles.toastWarn]}>
          <Text style={styles.toastText}>Reconectando con el servidor...</Text>
        </View>
      )}
      {error && (
        <View style={[styles.toast, styles.toastError]}>
          <Text style={styles.toastText}>{error.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 20 },
  menuBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#8d99ae',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  menuBtnText: { color: '#8d99ae', fontSize: 15 },
  toast: { position: 'absolute', left: 16, right: 16, top: 40, borderRadius: 8, padding: 12 },
  toastError: { backgroundColor: '#e63946' },
  toastWarn: { backgroundColor: '#e9c46a' },
  toastText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});