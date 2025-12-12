export interface Role {
  nombre: string;
}

export interface User {
  id: string;
  personaId: string;
  usuario: string;
  email: string;
  usuarioPadreId: string | null;
  estado: boolean;
  roles: Role[];
}
