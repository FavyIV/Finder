export type Role = 'USER' | 'SECURITY' | 'ADMIN';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: Role;
};

export type LoginPayload = {
  email: string;
  password: string;
};
