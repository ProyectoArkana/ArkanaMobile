import React from 'react';
import { CatalogCard, RARITY_LABEL, Rarity } from '../types/cards';
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

// ARK-009: color de la rareza
export const rarityColor = (rarity?: string): string => {
  switch (rarity) {
    case 'RARA':
      return '#4cc9f0';
    case 'EPICA':
      return '#b5179e';
    case 'LEGENDARIA':
      return '#f4a261';
    default:
      return '#8d99ae';
  }
};

// Lo que necesita mostrar una carta (una BattleCard del servidor ya cumple esta forma)
export interface CardLike {
  name: string;
  element: string;
  rarity?: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  mana: number;
  skillName: string;
  skillManaCost: number;
  skillPower: number;
  fainted?: boolean;
}

// Carta del catálogo (API, snake_case) -> forma que dibuja CardView
export const fromCatalog = (c: CatalogCard): CardLike => ({
  name: c.name,
  element: c.element,
  rarity: c.rarity,
  hp: c.hp,
  maxHp: c.hp,
  attack: c.attack,
  defense: c.defense,
  speed: c.speed,
  mana: c.mana,
  skillName: c.skill_name,
  skillManaCost: c.skill_mana_cost,
  skillPower: c.skill_power,
});

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

      {!compact && card.rarity && (
        <Text style={[styles.rarity, { color: rarityColor(card.rarity) }]}>
          ★ {RARITY_LABEL[card.rarity as Rarity] ?? card.rarity}
        </Text>
      )}

      <View style={styles.hpTrack}>
        <View style={[styles.hpFill, { width: widthPct, backgroundColor: hpColor(ratio) }]} />
      </View>
      <Text style={[styles.hpText, compact && styles.hpTextCompact]}>
        {card.fainted ? 'FUERA DE COMBATE' : `${card.hp}/${card.maxHp} HP`}
      </Text>

      <View style={styles.statsRow}>
        <Text style={[styles.stat, compact && styles.statCompact]}>⚔️ {card.attack}</Text>
        <Text style={[styles.stat, compact && styles.statCompact]}>🛡️ {card.defense}</Text>
        <Text style={[styles.stat, compact && styles.statCompact]}>💨 {card.speed}</Text>
        {!compact && <Text style={styles.stat}>🧪 {card.mana}</Text>}
      </View>
      {!compact && (
        <Text style={styles.skill}>
          ✨ {card.skillName} · poder {card.skillPower} · {card.skillManaCost} maná
        </Text>
      )}
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
  skill: { color: '#e9c46a', fontSize: 12, marginTop: 6 },
  rarity: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
});