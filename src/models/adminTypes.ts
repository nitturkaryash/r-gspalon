export interface Admin {
  id: string;
  username: string;
  password: string;
  created_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
} 