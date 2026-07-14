import * as argon2 from 'argon2';

// Hash no reversible de contraseñas (FR-030, RNF-01). argon2id recomendado (bcrypt también permitido).

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
