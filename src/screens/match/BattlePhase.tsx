import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CardView } from '../../components/CardView';

// (Si necesitas más imports originales, agrégalos aquí, pero estos son los que usa el componente)

export const BattlePhase = ({ socket, initialState }: any) => {
  // (Tus estados originales aquí)
  const [state, setState] = useState(initialState);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    // (Tu lógica de socket aquí)
    if (!socket) return;
    
    socket.on('battle:update', (newState: any) => {
      setState(newState);
    });

    return () => {
      socket.off('battle:update');
    };
  }, [socket]);

  if (!state) return null;

  const me = state.players[state.myIndex];
  const foe = state.players[1 - state.myIndex];

  return (
    <View style={styles.container}>
      {/* Carta del Oponente */}
      <View style={styles.enemyArea}>
        {foe.activeCard ? (
          <CardView 
            card={foe.activeCard as any} 
            selected={false} 
            compact={false} 
            style={styles.activeCard} 
          />
        ) : (
          <Text style={styles.emptyText}>Sin carta activa</Text>
        )}
      </View>

      {/* Información del Oponente */}
      <View style={styles.enemyInfo}>
        <Text style={styles.enemyName}>{foe.username}</Text>
        <Text style={styles.manaText}>🔮 Maná: {foe.mana}/{foe.maxMana}</Text>
      </View>

      {/* Log o Mensajes */}
      <ScrollView style={styles.logArea}>
        {state.log?.map((msg: string, i: number) => (
          <Text key={i} style={styles.logText}>{msg}</Text>
        ))}
      </ScrollView>

      {/* Carta del Jugador */}
      <View style={styles.myArea}>
        {me.activeCard ? (
          <CardView 
            card={me.activeCard as any} 
            selected={selectedCard === me.activeCard.id}
            onPress={() => setSelectedCard(me.activeCard.id)}
            style={styles.activeCard} 
          />
        ) : (
          <Text style={styles.emptyText}>Selecciona una carta</Text>
        )}
      </View>

      {/* Información del Jugador */}
      <View style={styles.myInfo}>
        <Text style={styles.myName}>{me.username}</Text>
        <Text style={styles.manaText}>🔮 Maná: {me.mana}/{me.maxMana}</Text>
      </View>

      {/* Banquillo del Jugador */}
      <View style={styles.benchRow}>
        {me.bench?.map((card: any) => (
          <View key={card.physicalCardId} style={styles.benchCardWrapper}>
            {/* Parche con 'as any' para evitar el error de tipos */}
            <CardView 
              card={card as any} 
              compact={true} 
              style={styles.benchCard}
              onPress={() => {
                // Lógica para cambiar de carta
                socket?.emit('battle:swap', { cardId: card.id });
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  enemyArea: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  myArea: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  activeCard: { width: 200 },
  benchRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
  benchCardWrapper: { width: 100 },
  benchCard: { width: '100%' },
  enemyInfo: { alignItems: 'center' },
  myInfo: { alignItems: 'center' },
  enemyName: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  myName: { color: '#2a9d8f', fontSize: 18, fontWeight: 'bold' },
  manaText: { color: '#8d99ae', fontSize: 14, marginTop: 4 },
  logArea: { flex: 1, backgroundColor: '#16213e', marginVertical: 10, padding: 10, borderRadius: 8 },
  logText: { color: '#bdc3c7', fontSize: 12, marginBottom: 4 },
  emptyText: { color: '#444', fontSize: 16, fontStyle: 'italic' }
});