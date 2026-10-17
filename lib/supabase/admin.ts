import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";
import { gosciaBlokujemy } from "../demo/straz";

/**
 * Service-role client - omija RLS. TYLKO server-side (API routes, server
 * actions). Cały dostęp do danych aplikacji idzie przez ten klient, a
 * autoryzację (kto może co) egzekwujemy w kodzie na podstawie sesji usera.
 * Klucz service_role NIGDY nie trafia do przeglądarki.
 *
 * Każdy zapis przechodzi przez strażnika wersji demo: gość demo czyta wszystko,
 * ale insert/update/upsert/delete, rpc, pliki i konta wracają z błędem.
 */
export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY w env.");
  }

  const klient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return zeStraza(klient);
}

const BLAD_DEMO = { message: "Wersja demo: zapisywanie jest wyłączone.", code: "DEMO", details: "", hint: "" };
const ODMOWA = { data: null, error: BLAD_DEMO, count: null, status: 403, statusText: "demo" };
const ZAPIS = new Set(["insert", "update", "upsert", "delete"]);
const PLIKI = new Set(["upload", "update", "remove", "move", "copy", "createSignedUploadUrl", "uploadToSignedUrl"]);

/** Zapytanie-obietnica, które przed wysłaniem sprawdza, czy pyta gość demo. */
function strzezonyBudowniczy<T extends object>(cel: T): T {
  return new Proxy(cel, {
    get(t, p, r) {
      const v = Reflect.get(t, p, r);
      if (p === "then") {
        return (ok: (w: unknown) => unknown, zle?: (e: unknown) => unknown) =>
          gosciaBlokujemy().then((blokuj) => (blokuj ? ok(ODMOWA) : (t as unknown as PromiseLike<unknown>).then(ok, zle)));
      }
      if (typeof v === "function") return (...a: unknown[]) => strzezonyBudowniczy(v.apply(t, a));
      return v;
    },
  });
}

/** Zwykła funkcja asynchroniczna z odmową dla gościa demo. */
function strzezonaFunkcja(fn: (...a: unknown[]) => Promise<unknown>, ten: unknown) {
  return async (...a: unknown[]) => ((await gosciaBlokujemy()) ? ODMOWA : fn.apply(ten, a));
}

function zeStraza<K extends object>(klient: K): K {
  return new Proxy(klient as unknown as SupabaseClient, {
    get(t, p, r) {
      const v = Reflect.get(t, p, r);
      if (p === "from") {
        return (tabela: string) =>
          new Proxy(t.from(tabela), {
            get(q, m, qr) {
              const f = Reflect.get(q, m, qr);
              if (typeof m === "string" && ZAPIS.has(m) && typeof f === "function") {
                return (...a: unknown[]) => strzezonyBudowniczy(f.apply(q, a));
              }
              return typeof f === "function" ? f.bind(q) : f;
            },
          });
      }
      if (p === "rpc") return (...a: unknown[]) => strzezonyBudowniczy((v as (...x: unknown[]) => object).apply(t, a));
      if (p === "storage") {
        return new Proxy(t.storage, {
          get(s, m, sr) {
            const f = Reflect.get(s, m, sr);
            if (m !== "from") return typeof f === "function" ? f.bind(s) : f;
            return (kubel: string) =>
              new Proxy(s.from(kubel), {
                get(b, n, br) {
                  const g = Reflect.get(b, n, br);
                  if (typeof g !== "function") return g;
                  return typeof n === "string" && PLIKI.has(n) ? strzezonaFunkcja(g, b) : g.bind(b);
                },
              });
          },
        });
      }
      if (p === "auth") {
        return new Proxy(t.auth, {
          get(a, m, ar) {
            const f = Reflect.get(a, m, ar);
            if (m !== "admin") return typeof f === "function" ? f.bind(a) : f;
            return new Proxy(a.admin, {
              get(ad, n, adr) {
                const g = Reflect.get(ad, n, adr);
                return typeof g === "function" ? strzezonaFunkcja(g, ad) : g;
              },
            });
          },
        });
      }
      return typeof v === "function" ? v.bind(t) : v;
    },
  }) as unknown as K;
}
