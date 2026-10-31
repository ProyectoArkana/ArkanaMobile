export interface CatalogCard {
  id: string;
  name: string;
  element: string;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  manaCost: number;
  imageUrl?: string;
  rarity?: string;
}