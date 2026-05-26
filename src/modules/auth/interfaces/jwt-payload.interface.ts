export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface RequestUser {
  userId: number;
  email: string;
  role: string;
}