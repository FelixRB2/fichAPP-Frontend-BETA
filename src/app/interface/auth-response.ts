export interface AuthResponse {
  token: string;
  rol: string;
  nombre: string;
  id: string;
  user?: any; // To match the check in service
}
