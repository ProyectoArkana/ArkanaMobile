export type MatchStatus = 'PICKING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
export type MatchPhase = 'CHOOSING' | 'REPLACING' | null;

export interface BattleCard {
  cardId: number;
  name: string;
  element: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  skillName: string;
  skillManaCost: number;
  skillPower: number;
  imageUrl: string | null;
  fainted: boolean;
}

export interface PlayerView {
  userId: string;
  username: string;
  connected: boolean;
  picksReady: boolean;
  hasChosen: boolean; // ya eligió acción en este turno (la acción del rival nunca se revela)
  shields: number;
  activeIndex: number;
  cards: BattleCard[] | null; // las del rival llegan cuando empieza la batalla
}

export interface LogEntry {
  id: number;
  turn: number;
  text: string;
}

// Estado de la partida tal como lo envía el servidor (única fuente de verdad)
export interface MatchView {
  matchId: string;
  status: MatchStatus;
  phase: MatchPhase;
  turnNumber: number;
  pendingSwitch: string[]; // userIds que deben reemplazar su carta caída
  winnerId: string | null;
  endReason: string | null;
  deckSize: number;
  maxShields: number;
  me: PlayerView;
  opponent: PlayerView;
  log: LogEntry[];
}

// Cada turno: atacar, hacer switch con la banca o activar un escudo
export type BattleAction =
  | { type: 'attack' }
  | { type: 'shield' }
  | { type: 'switch'; toIndex: number };
