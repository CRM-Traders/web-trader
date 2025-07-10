export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expires_in?: number;
  user?: UserInfo;
}

export interface RegisterResponse {
  username: string;
  email: string;
  password: string;
}

export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  isEmailConfirmed: boolean;
  role: string;
  isTwoFactorEnabled: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: string;
}

export interface SessionData {
  token: string;
  refreshToken: string;
  user?: UserInfo;
  createdAt: string;
  updatedAt?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expires_in?: number;
}

export interface AuthConfirmRequest {
  authkey: string;
}

export interface AuthConfirmResponse {
  accessToken: string;
  refreshToken?: string;
  expires_in?: number;
  user?: UserInfo;
}
