export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroClienteRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
}

export interface ClientePatchRequest {
  nombre: string;
  apellido: string;
  telefono: string;
}
