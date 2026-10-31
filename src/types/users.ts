export type UserRole = 'PLAYER' | 'ADMIN';

export const ROLE_LABEL: Record<UserRole, string> = {
  PLAYER: 'Jugador',
  ADMIN: 'Administrador',
};

// Usuario tal como lo devuelve /api/admin/users (nunca incluye la contraseña)
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  wins: number;
  losses: number;
  created_at: string;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}
