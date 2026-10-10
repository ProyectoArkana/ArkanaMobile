import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Keychain from 'react-native-keychain';
import { MATCH_SOCKET_URL } from '../api/config';
import { BattleAction, MatchView } from '../types/match';

interface MatchError {
  key: number;
  message: string;
}

export const useMatchSocket = (matchId: string, username: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [view, setView] = useState<MatchView | null>(null);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [error, setError] = useState<MatchError | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const credentials = await Keychain.getGenericPassword();
      if (cancelled) return;
      if (!credentials) {
        setFatalError('No hay sesión activa. Vuelve a iniciar sesión.');
        return;
      }

      console.log('🎮 Conectando a match-service:', MATCH_SOCKET_URL);
      const socket = io(MATCH_SOCKET_URL, { auth: { token: credentials.password }, timeout: 5000 });
      socketRef.current = socket;

      // También se dispara tras una reconexión: volvemos a unirnos a la partida
      socket.on('connect', () => {
        setConnected(true);
        setFatalError(null);
        socket.emit('match:join', { matchId, username });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', (e) => setFatalError(`No se pudo conectar: ${e.message}`));
      socket.on('match:state', (v: MatchView) => setView(v));
      socket.on('match:error', (e: { code: string; message: string }) => {
        console.log('⚠️ match:error', e.code, e.message);
        setError({ key: Date.now(), message: e.message });
      });
    })();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [matchId, username]);

  const submitPicks = useCallback((nfcUids: string[]) => {
    socketRef.current?.emit('picks:submit', { nfcUids });
  }, []);

  const sendAction = useCallback((action: BattleAction) => {
    socketRef.current?.emit('battle:action', action);
  }, []);

  const forfeit = useCallback(() => {
    socketRef.current?.emit('match:forfeit');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { view, connected, fatalError, error, clearError, submitPicks, sendAction, forfeit };
};