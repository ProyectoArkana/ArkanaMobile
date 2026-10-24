import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BATTLE_SOCKET_PATH, SOCKET_ORIGIN } from '../api/config';
import { useAuthStore } from '../store/useAuthStore';
import { BattleAction, MatchView } from '../types/match';

interface MatchError {
  key: number;
  message: string;
}

export const useMatchSocket = (matchId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [view, setView] = useState<MatchView | null>(null);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [error, setError] = useState<MatchError | null>(null);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (!token) {
      setFatalError('No hay sesión activa. Vuelve a iniciar sesión.');
      return;
    }

    const socket = io(SOCKET_ORIGIN, {
      path: BATTLE_SOCKET_PATH,
      auth: { token },
      transports: ['websocket'],
      timeout: 5000,
    });
    socketRef.current = socket;

    // También se dispara tras una reconexión: volvemos a entrar a la sala y el servidor
    // nos reenvía el estado actual de la partida.
    socket.on('connect', () => {
      setConnected(true);
      setFatalError(null);
      socket.emit('match:join', { matchId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) =>
      setFatalError(e.message === 'unauthorized' ? 'Sesión inválida. Vuelve a iniciar sesión.' : `No se pudo conectar: ${e.message}`),
    );
    socket.on('match:state', (v: MatchView) => setView(v));
    socket.on('match:error', (e: { code: string; message: string }) =>
      setError({ key: Date.now(), message: e.message }),
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const submitPicks = useCallback((nfcIds: string[]) => {
    socketRef.current?.emit('picks:submit', { nfcIds });
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
