export type MatchStatus = 'PICKING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';

export interface BattleCard {
  physicalCardId: string;
  name: string;
  element: string;
  hp: number;
  maxHp: number;
  attack: number;
  manaCost: number;
  fainted: boolean;
}

export interface PlayerView {
  userId: string;
  username: string;
  connected?: boolean;
  picksReady: boolean;
  mana: number;
  activeIndex: number;
  cards: BattleCard[] | null;
}

export interface LogEntry {
  id: number;
  turn: number;
  text: string;
}

export interface MatchView {
  matchId: string;
  status: MatchStatus;
  turn: string | null;
  turnNumber: number;
  pendingSwitch: string | null;
  winnerId: string | null;
  endReason: string | null;
  maxMana: number;
  deckSize: number;
  me: PlayerView;
  opponent: PlayerView | null;
  log: LogEntry[];
}

export type BattleAction =
  | { type: 'attack' }
  | { type: 'pass' }
  | { type: 'switch'; toIndex: number };

// Tarjeta tal como la devuelve GET /cards/inventory
export interface InventoryCard {
  physical_card_id: string;
  nfc_uid: string;
  card_id: number;
  name: string;
  element: string;
  hp: number;
  mana_cost: number;
  attack: number;
  rarity: string;
}