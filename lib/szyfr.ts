import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Szyfrowanie sekretów w bazie (tokeny OAuth portali). AES-256-GCM, klucz
 * w PORTAL_TOKEN_KEY (64 znaki hex). Zapis: iv.tag.dane w base64url.
 * Bez klucza nie zapisujemy nic: lepiej odmówić połączenia niż trzymać
 * tokeny jawnie.
 */
function klucz(): Buffer {
  const k = process.env.PORTAL_TOKEN_KEY?.trim();
  if (!k || !/^[0-9a-f]{64}$/i.test(k)) throw new Error("Brak PORTAL_TOKEN_KEY (64 znaki hex).");
  return Buffer.from(k, "hex");
}

export function zaszyfruj(tekst: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", klucz(), iv);
  const dane = Buffer.concat([c.update(tekst, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), dane].map((b) => b.toString("base64url")).join(".");
}

export function odszyfruj(zapis: string): string {
  const [iv, tag, dane] = zapis.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = createDecipheriv("aes-256-gcm", klucz(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dane), d.final()]).toString("utf8");
}
