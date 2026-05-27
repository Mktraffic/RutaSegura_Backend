export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  personId: number;
}

export interface RequestUser {
  userId: number;
  email: string;
  role: string;
  personId: number;
}