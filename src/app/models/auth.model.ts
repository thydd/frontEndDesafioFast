export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  username: string;
  role: string;
}
