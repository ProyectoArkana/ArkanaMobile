import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  CardFiltersState,
  ELEMENTS,
  EMPTY_FILTERS,
  RARITIES,
  RARITY_LABEL,
  countActiveFilters,
} from '../types/cards';
import { elementColor } from './CardView';

interface Props {
  value: CardFiltersState;
  onChange: (next: CardFiltersState) => void;
}

const toggleItem = (list: string[], item: string) =>
  list.includes(item) ? list.filter(x => x !== item) : [...list, item];

const digits = (text: string) => text.replace(/\D/g, '').slice(0, 4);

interface RangeProps {
  label: string;
  min: string;
  max: string;
  onMin: (text: string) => void;
  onMax: (text: string) => void;
}

const RangeRow = ({ label, min, max, onMin, onMax }: RangeProps) => (
  <View style={styles.rangeRow}>
    <Text style={styles.rangeLabel}>{label}</Text>
    <TextInput
      style={styles.rangeInput}
      placeholder="Mín"
      placeholderTextColor="#8d99ae"
      keyboardType="number-pad"
      value={min}
      onChangeText={t => onMin(digits(t))}
    />
    <Text style={styles.rangeDash}>–</Text>
    <TextInput
      style={styles.rangeInput}
      placeholder="Máx"
      placeholderTextColor="#8d99ae"
      keyboardType="number-pad"
      value={max}
      onChangeText={t => onMax(digits(t))}
    />
  </View>
);

// ARK-009: panel plegable de filtros (elemento, rareza, rango de ataque y de defensa)
export const CardFilters = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(value);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.toggle} onPress={() => setOpen(o => !o)}>
          <Text style={styles.toggleText}>
            {open ? '▾' : '▸'} Filtros{active > 0 ? ` (${active})` : ''}
          </Text>
        </TouchableOpacity>
        {active > 0 && (
          <TouchableOpacity onPress={() => onChange(EMPTY_FILTERS)}>
            <Text style={styles.clear}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {open && (
        <View style={styles.panel}>
          <Text style={styles.section}>Elemento</Text>
          <View style={styles.chips}>
            {ELEMENTS.map(el => {
              const on = value.elements.includes(el);
              return (
                <TouchableOpacity
                  key={el}
                  style={[styles.chip, on && { backgroundColor: elementColor(el), borderColor: elementColor(el) }]}
                  onPress={() => onChange({ ...value, elements: toggleItem(value.elements, el) })}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{el}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.section}>Rareza</Text>
          <View style={styles.chips}>
            {RARITIES.map(r => {
              const on = value.rarities.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => onChange({ ...value, rarities: toggleItem(value.rarities, r) })}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{RARITY_LABEL[r]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <RangeRow
            label="Ataque"
            min={value.minAttack}
            max={value.maxAttack}
            onMin={t => onChange({ ...value, minAttack: t })}
            onMax={t => onChange({ ...value, maxAttack: t })}
          />
          <RangeRow
            label="Defensa"
            min={value.minDefense}
            max={value.maxDefense}
            onMin={t => onChange({ ...value, minDefense: t })}
            onMax={t => onChange({ ...value, maxDefense: t })}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { paddingVertical: 6 },
  toggleText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  clear: { color: '#e94560', fontSize: 14, fontWeight: '600' },
  panel: { backgroundColor: '#16213e', borderRadius: 10, padding: 12, marginTop: 6 },
  section: { color: '#8d99ae', fontSize: 12, fontWeight: 'bold', marginTop: 8, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#8d99ae', fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rangeLabel: { color: '#fff', fontSize: 14, width: 70 },
  rangeInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
  },
  rangeDash: { color: '#8d99ae', marginHorizontal: 8 },
});
