import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CardView } from '../../components/CardView';

// Usamos 'any' para el argumento y el retorno para evitar conflictos de tipos
const toCardLike = (c: any): any => ({
  name: c.name,
  element: c.element,
  hp: c.hp,
  maxHp: c.maxHp || c.hp,
  attack: c.attack,
  defense: c.defense || 0,
  speed: c.speed || 0,
});

interface Props {
   inventory?: any[];
  onPick?: (cardIds: string[]) => void;
  view?: any;
  opponentName?: string;
  errorKey?: number;
  onSubmit?: (nfcUids: string[]) => void;
  onLeave?: () => void;
}

export const PickPhase = ({ inventory, onPick }: Props) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length === 5 && onPick) {
      onPick(selectedIds); // ✅ Ahora verifica que onPick exista
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona tu equipo</Text>
      <Text style={styles.subtitle}>
        Elige 5 cartas de tu inventario ({selectedIds.length}/5)
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         {(inventory || []).map((card) => (
          <View key={card.id} style={styles.cardWrapper}>
            <CardView
              card={toCardLike(card)}
              compact={false}
              selected={selectedIds.includes(card.id)}
              onPress={() => toggleSelection(card.id)}
            />
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          selectedIds.length !== 5 && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={selectedIds.length !== 5}
      >
        <Text style={styles.confirmText}>Confirmar equipo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8d99ae',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  cardWrapper: {
    width: 150,
  },
  confirmButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#444',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});