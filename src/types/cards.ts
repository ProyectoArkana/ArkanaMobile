export const ELEMENTS = ['FUEGO', 'AGUA', 'AIRE', 'TIERRA', 'PLANTA'] as const;
export const RARITIES = ['COMUN', 'RARA', 'EPICA', 'LEGENDARIA'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_LABEL: Record<Rarity, string> = {
  COMUN: 'Común',
  RARA: 'Rara',
  EPICA: 'Épica',
  LEGENDARIA: 'Legendaria',
};

// Carta del catálogo tal como la devuelve el backend (GET /cards, POST /cards/scan, GET /cards/gallery)
export interface CatalogCard {
  id: number;
  name: string;
  element: string;
  rarity?: Rarity;
  hp: number;
  mana: number;
  attack: number;
  defense: number;
  speed: number;
  skill_name: string;
  skill_mana_cost: number;
  skill_power: number;
  image_url: string | null;
}

export interface GalleryCard extends CatalogCard {
  unlocked_at: string;
}

// ARK-009: estado de los filtros del catálogo (los rangos son texto porque vienen de un TextInput)
export interface CardFiltersState {
  elements: string[];
  rarities: string[];
  minAttack: string;
  maxAttack: string;
  minDefense: string;
  maxDefense: string;
}

export const EMPTY_FILTERS: CardFiltersState = {
  elements: [],
  rarities: [],
  minAttack: '',
  maxAttack: '',
  minDefense: '',
  maxDefense: '',
};

export const countActiveFilters = (f: CardFiltersState): number =>
  (f.elements.length > 0 ? 1 : 0) +
  (f.rarities.length > 0 ? 1 : 0) +
  (f.minAttack || f.maxAttack ? 1 : 0) +
  (f.minDefense || f.maxDefense ? 1 : 0);

// Parámetros de query de GET /cards (solo los que tienen valor)
export const filtersToParams = (f: CardFiltersState): Record<string, string> => {
  const params: Record<string, string> = {};
  if (f.elements.length) params.element = f.elements.join(',');
  if (f.rarities.length) params.rarity = f.rarities.join(',');
  if (f.minAttack) params.min_attack = f.minAttack;
  if (f.maxAttack) params.max_attack = f.maxAttack;
  if (f.minDefense) params.min_defense = f.minDefense;
  if (f.maxDefense) params.max_defense = f.maxDefense;
  return params;
};
