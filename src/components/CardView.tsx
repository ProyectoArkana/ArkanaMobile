import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export const elementColor = (element: string): string => {
  switch (element) {
    case 'FUEGO':
      return '#e63946';
    case 'AGUA':
      return '#457b9d';
    case 'PLANTA':
      return '#2a9d8f';
    case 'TIERRA':
      return '#e9c46a';
    case 'AIRE':
      return '#a8dadc';
    default:
      return '#6c757d';
  }
};

export interface CardLike {
  name: string;
  element: string;
  hp: number;
  maxHp: number;
  attack: number;
  manaCost: number;
  fainted?: boolean;
}

interface Props {
  card: CardLike;
  compact?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const hpColor = (ratio: number) => (ratio > 0.5 ? '#2a9d8f' : ratio > 0.25 ? '#e9c46a' : '#e63946');

export const CardView = ({ card, compact = false, selected = false, disabled = false, onPress, style }: Props) => {
  const ratio = card.maxHp > 0 ? Math.max(0, Math.min(1, card.hp / card.maxHp)) : 0;
  const widthPct = `${Math.round(ratio * 100)}%` as `${number}%`;
  const borderColor = card.fainted ? '#444' : elementColor(card.element);

  const content = (
    <>
      <View style={styles.headerRow}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {card.name}
        </Text>
        {!compact && (
          <View style={[styles.badge, { backgroundColor: elementColor(card.element) }]}>
            <Text style={styles.badgeText}>{card.element}</Text>
          </View>
        )}
      </View>

      <View style={styles.hpTrack}>
        <View style={[styles.hpFill, { width: widthPct, backgroundColor: hpColor(ratio) }]} />
      </View>
      <Text style={[styles.hpText, compact && styles.hpTextCompact]}>
        {card.fainted ? 'FUERA DE COMBATE' : `${card.hp}/${card.maxHp} HP`}
      </Text>

      <View style={styles.statsRow}>
        <Text style={[styles.stat, compact && styles.statCompact]}>⚔️ {card.attack}</Text>
        <Text style={[styles.stat, compact && styles.statCompact]}>🧪 {card.manaCost}</Text>
      </View>
    </>
  );

  const containerStyle = [
    styles.card,
    compact && styles.cardCompact,
    { borderColor },
    selected && styles.selected,
    card.fainted && styles.fainted,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} style={containerStyle} onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 2,
    padding: 12,
  },
  cardCompact: { padding: 6, borderRadius: 8 },
  selected: { backgroundColor: '#1f2b4d', borderWidth: 3 },
  fainted: { opacity: 0.45 },
  disabled: { opacity: 0.6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold', flexShrink: 1 },
  nameCompact: { fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  hpTrack: { height: 8, backgroundColor: '#0f3460', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  hpFill: { height: 8, borderRadius: 4 },
  hpText: { color: '#bdc3c7', fontSize: 12, marginTop: 4 },
  hpTextCompact: { fontSize: 9 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  stat: { color: '#bdc3c7', fontSize: 14 },
  statCompact: { fontSize: 10 },
});