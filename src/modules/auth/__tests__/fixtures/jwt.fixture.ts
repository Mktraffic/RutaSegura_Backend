/**
 * Payloads de JWT válidos
 */
export const validJwtPayloads = {
  coordinator: {
    sub: 1,
    email: 'coordinator@test.com',
    role: 'coordinator',
  },
  driver: {
    sub: 2,
    email: 'driver@test.com',
    role: 'driver',
  },
  coordinador: {
    sub: 1,
    email: 'coordinator@test.com',
    role: 'coordinador',
  },
  conductor: {
    sub: 2,
    email: 'driver@test.com',
    role: 'conductor',
  },
};

/**
 * Payloads de JWT inválidos o incompletos
 */
export const invalidJwtPayloads = {
  missingRole: {
    sub: 1,
    email: 'test@test.com',
  },
  missingSub: {
    email: 'test@test.com',
    role: 'coordinator',
  },
  missingEmail: {
    sub: 1,
    role: 'coordinator',
  },
  invalidRole: {
    sub: 1,
    email: 'test@test.com',
    role: 'admin',
  },
  noData: {},
};

/**
 * Respuesta esperada del login
 */
export const loginResponseStructure = {
  accessToken: expect.any(String),
  tokenType: 'Bearer',
  expiresIn: expect.any(String),
  expiresInSeconds: expect.any(Number),
  user: {
    id: expect.any(Number),
    email: expect.any(String),
    personId: expect.any(Number),
    fullName: expect.any(String),
    role: expect.any(String),
    status: expect.any(String),
  },
};

/**
 * TTL strings para pruebas de parsing
 */
export const ttlFormats = [
  { input: '30s', expected: 30 },
  { input: '5m', expected: 300 },
  { input: '1h', expected: 3600 },
  { input: '7d', expected: 604800 },
  { input: '  2h  ', expected: 7200 },
];

/**
 * TTL strings inválidos
 */
export const invalidTtlFormats = ['invalid', '5x', 'h5', '', '   '];

/**
 * Tokens JWT válidos (simulados)
 */
export const validTokens = {
  coordinator:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiY29vcmRpbmF0b3JAd GVzdC5jb20iLCJyb2xlIjoiY29vcmRpbmF0b3IifQ.validSignature',
  driver:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiZHJpdmVyQHRlc3QuY29tIiwicm9sZSI6ImRyaXZlciJ9.validSignature',
};

/**
 * Tokens JWT inválidos
 */
export const invalidTokens = {
  malformed: 'not.a.valid.token.format',
  modified: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MODIFIED.invalidSignature',
  empty: '',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NzczODAwMDB9.expiredSignature',
};
