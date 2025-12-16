export interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  roles: Role[];
}
