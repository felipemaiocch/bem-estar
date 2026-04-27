import { SignJWT, jwtVerify } from "jose";

import type { SessionPayload } from "@/types";

const fallbackSecret = "se-monitora-dev-secret-change-me";

function getJwtSecret() {
  const secretValue = process.env.JWT_SECRET;

  if (secretValue) {
    return new TextEncoder().encode(secretValue);
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("AVISO: JWT_SECRET não configurado em produção. Usando chave de fallback (inseguro para dados reais).");
  }

  return new TextEncoder().encode(fallbackSecret);
}

export async function signToken(payload: SessionPayload) {
  const secret = getJwtSecret();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
