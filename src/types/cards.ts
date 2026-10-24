// Carta del catálogo tal como la devuelve el backend (GET /cards, POST /cards/scan, GET /cards/gallery)
export interface CatalogCard {
  id: number;
  name: string;
  element: string;
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
