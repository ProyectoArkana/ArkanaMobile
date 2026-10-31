import { CatalogCard } from './cards';

// ARK-020: el mazo activo tiene exactamente 5 cartas distintas de tu colección
export const DECK_SIZE = 5;

export interface DeckError {
  code: string;
  message: string;
  card_id?: number;
}

export interface DeckCard extends CatalogCard {
  position: number;
}

export interface ActiveDeck {
  cards: DeckCard[];
  updated_at: string;
}

export interface ActiveDeckResponse {
  deck: ActiveDeck | null;
}

export interface ValidateDeckResponse {
  valid: boolean;
  errors: DeckError[];
}

// Pre-validación local (tamaño y repetidas) para no llamar al servidor con un mazo imposible.
// La validación definitiva (existencia y colección) la hace siempre el servidor.
export const validateDeckLocally = (ids: number[]): DeckError[] => {
  const errors: DeckError[] = [];
  if (ids.length !== DECK_SIZE) {
    errors.push({
      code: 'DECK_SIZE',
      message: `El mazo debe tener exactamente ${DECK_SIZE} cartas (tienes ${ids.length}).`,
    });
  }
  if (new Set(ids).size !== ids.length) {
    errors.push({ code: 'DECK_DUPLICATE', message: 'Hay cartas repetidas en el mazo.' });
  }
  return errors;
};
