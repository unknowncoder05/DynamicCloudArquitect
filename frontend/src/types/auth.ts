import { AuthProvider } from '../utils/constants';

export interface User {
  id: string;
  username: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number: string;
  preferred_provider: string;
  role?: string;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface RequestCodeRequest {
  phone_number: string;
  provider?: AuthProvider;
}

export interface ValidateAccountRequest {
  phone_number: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
