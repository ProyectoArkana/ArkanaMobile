import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardView } from '../../components/CardView';
import { BattleAction, MatchStatus, MatchView } from '../../types/match';

interface Props {
  view: MatchView;
  opponentName: string;
  onAction: (action: BattleAction) => void;
  onForfeit: () => void;
  onExit: () => void;
}

const REASON_TEXT: Record<string, { win: string; lose: string }> = {
  ALL_FAINTED: { win: 'Dejaste a tu rival sin cartas.', lose: 'Te quedaste sin cartas.' },
  FORFEIT: { win: 'Tu rival abandonó la partida.', lose: 'Abandonaste la partida.' },
  OPPONENT_DISCONNECTED: { win: 'Tu rival se desconectó.', lose: 'Perdiste por desconexión.' },
};

/* ------------------------- Alerta de resultado ------------------------- */

const ResultModal = ({
  visible,
  status,
  won,
  reason,
  onExit,
}: {
  visible: boolean;
  status: MatchStatus;
  won: boolean;
  reason: string | null;
  onExit: () => void;
}) => {
  const cancelled = status === 'ABANDONED';
  const title = cancelled ? 'Partida cancelada' : won ? '¡Ganaste! 🏆' : 'Perdiste 💀';
  const message = cancelled
    ? 'La partida se canceló.'
    : (reason && REASON_TEXT[reason]?.[won ? 'win' : 'lose']) || (won ? 'Victoria.' : 'Derrota.');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onExit}>
      <View style={styles.modalBackdrop}>
        <View style={[
          styles.modalBox, 
          cancelled ? styles.modalBoxCancelled : (won ? styles.modalBoxWon : styles.modalBoxLost)
        ]}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onExit}>
            <Text style={styles.modalButtonText}>Volver al menú</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* ------------------------------- Batalla ------------------------------- */

export const BattlePhase = ({ view, opponentName, onAction, onForfeit, onExit }: Props) => {
  const { me, opponent: foe } = view;
  const over = view.status === 'FINISHED' || view.status === 'ABANDONED';

  const resultModal = (
    <ResultModal
      visible={over}
      status={view.status}
      won={view.winnerId === me.userId}
      reason={view.endReason}
      onExit={onExit}
    />
  );

  // Si la partida terminó antes de repartir cartas (por ejemplo, abandono en picks)
  if (!me.cards || !foe || !foe.cards) {
    return (
      <View style={styles.center}>
        <Text style={styles.waitText}>Preparando la batalla contra {opponentName}...</Text>
        {resultModal}
      </View>
    );
  }

  const myCards = me.cards;
  const foeCards = foe.cards;
  const myActive = myCards[me.activeIndex];
  const foeActive = foeCards[foe.activeIndex];

  const myTurn = view.turn === me.userId;
  const mustSwitch = !over && view.pendingSwitch === me.userId;
  const foeMustSwitch = !over && view.pendingSwitch === foe.userId;
  const canAct = !over && myTurn && !mustSwitch;
  const canAttack = canAct && me.mana >= myActive.manaCost;

  const myBench = myCards.map((card, index) => ({ card, index })).filter((x) => x.index !== me.activeIndex);
  const foeBench = foeCards.map((card, index) => ({ card, index })).filter((x) => x.index !== foe.activeIndex);

  let banner: string;
  if (over) banner = 'La partida terminó';
  else if (mustSwitch) banner = '💥 Tu carta cayó: elige otra de tu banca';
  else if (foeMustSwitch) banner = `${foe.username} está eligiendo su reemplazo...`;
  else if (myTurn) banner = '🟢 Tu turno';
  else banner = `⏳ Turno de ${foe.username}`;

  const handleBenchPress = (index: number) => {
    if (mustSwitch) {
      onAction({ type: 'switch', toIndex: index });
      return;
    }
    Alert.alert('Cambiar de carta', `¿Enviar a ${myCards[index].name}? Usarás tu turno.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cambiar', onPress: () => onAction({ type: 'switch', toIndex: index }) },
    ]);
  };

  const confirmForfeit = () => {
    Alert.alert('Abandonar partida', 'Si abandonas, tu rival ganará. ¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abandonar', style: 'destructive', onPress: onForfeit },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ----- Rival (arriba) ----- */}
        <View style={styles.sideHeader}>
          <Text style={styles.playerName}>{foe.username}</Text>
          <Text style={styles.mana}>
            🧪 {foe.mana}/{view.maxMana}
          </Text>
        </View>
        {foe.connected === false && !over && (
          <Text style={styles.warn}>Rival desconectado, esperando reconexión...</Text>
        )}
        <View style={styles.benchRow}>
          {foeBench.map(({ card }) => (
            <CardView key={card.physicalCardId} card={card} compact style={styles.benchCard} />
          ))}
        </View>
        <CardView card={foeActive} />

        {/* ----- Centro ----- */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
          {view.log.slice(-3).map((entry, i, arr) => (
            <Text key={entry.id} style={[styles.logText, i === arr.length - 1 && styles.logLast]}>
              {entry.text}
            </Text>
          ))}
        </View>

        {/* ----- Yo (abajo) ----- */}
        <CardView card={myActive} selected />
        <View style={styles.sideHeader}>
          <Text style={styles.playerName}>{me.username} (tú)</Text>
          <Text style={styles.mana}>
            🧪 {me.mana}/{view.maxMana}
          </Text>
        </View>

        <Text style={styles.benchLabel}>Tu banca</Text>
        <View style={styles.benchRow}>
          {myBench.map(({ card, index }) => {
            const enabled = !over && (mustSwitch || canAct) && !card.fainted;
            return (
              <CardView
                key={card.physicalCardId}
                card={card}
                compact
                style={styles.benchCard}
                disabled={!enabled}
                onPress={() => handleBenchPress(index)}
              />
            );
          })}
        </View>

        {!over && !mustSwitch && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.attackBtn, !canAttack && styles.btnDisabled]}
              disabled={!canAttack}
              onPress={() => onAction({ type: 'attack' })}
            >
              <Text style={styles.attackText}>⚔️ Atacar (🧪 {myActive.manaCost})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waitBtn, !canAct && styles.btnDisabled]}
              disabled={!canAct}
              onPress={() => onAction({ type: 'pass' })}
            >
              <Text style={styles.waitBtnText}>⏳ Esperar</Text>
            </TouchableOpacity>
          </View>
        )}
        {canAct && !canAttack && (
          <Text style={styles.hint}>Maná insuficiente para atacar: cambia de carta o espera.</Text>
        )}
        {mustSwitch && <Text style={styles.hint}>Toca una carta de tu banca para enviarla al combate.</Text>}

        {!over && (
          <TouchableOpacity onPress={confirmForfeit} style={styles.forfeitBtn}>
            <Text style={styles.forfeitText}>Abandonar partida</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {resultModal}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 14, paddingBottom: 28 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitText: { color: '#8d99ae', fontSize: 16, textAlign: 'center' },
  sideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  playerName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mana: { color: '#a8dadc', fontSize: 14, fontWeight: 'bold' },
  warn: { color: '#e9c46a', fontSize: 12, marginBottom: 6 },
  benchRow: { flexDirection: 'row', marginBottom: 10 },
  benchCard: { flex: 1, marginHorizontal: 2 },
  benchLabel: { color: '#8d99ae', fontSize: 12, marginBottom: 6 },
  banner: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    marginVertical: 14,
    alignItems: 'center',
  },
  bannerText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  logText: { color: '#8d99ae', fontSize: 12, textAlign: 'center', marginTop: 2 },
  logLast: { color: '#fff' },
  actionsRow: { flexDirection: 'row', marginTop: 4 },
  attackBtn: {
    flex: 2,
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  attackText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  waitBtn: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#8d99ae',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  waitBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.4 },
  hint: { color: '#e9c46a', fontSize: 12, textAlign: 'center', marginTop: 10 },
  forfeitBtn: { marginTop: 22, alignItems: 'center', padding: 8 },
  forfeitText: { color: '#e63946', fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: 16,
    borderWidth: 3,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 30, fontWeight: 'bold', textAlign: 'center' },
  modalMessage: { color: '#bdc3c7', fontSize: 15, textAlign: 'center', marginTop: 12 },
  modalButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 26,
  },
  modalBoxCancelled: { borderColor: '#8d99ae' },
  modalBoxWon: { borderColor: '#2a9d8f' },
  modalBoxLost: { borderColor: '#e63946' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});