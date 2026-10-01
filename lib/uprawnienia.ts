/**
 * Reguły „kto może co” w jednym miejscu, bez dostępu do bazy, żeby dało się
 * je sprawdzić testem (`npm run test:uprawnienia`).
 *
 * CEO (`owner`) zarządza całym biurem. Menedżer porządkuje pracę zespołu, ale
 * nie widzi pieniędzy cudzych transakcji. Agent zarządza tym, czego jest
 * opiekunem; rekordy bez opiekuna (pula biura) może przejąć.
 */

export type Kto = { id: string; role: string; agency_id: string | null };

type ZOpiekunem = { agent_id?: string | null };

function zarzadza(user: Kto): boolean {
  return user.role === "owner" || user.role === "manager";
}

/** Usunięcie klienta, oferty lub poszukiwania. */
export function mozeUsunac(user: Kto, rekord: ZOpiekunem): boolean {
  return zarzadza(user) || (!!rekord.agent_id && rekord.agent_id === user.id);
}

/**
 * Zmiana opiekuna. Agent może oddać swój rekord albo wziąć coś z puli biura,
 * ale nie zabrać klienta koledze.
 */
export function mozePrzepisac(user: Kto, rekord: ZOpiekunem): boolean {
  return zarzadza(user) || !rekord.agent_id || rekord.agent_id === user.id;
}

/** Kwoty prowizji i zarobku z transakcji. Menedżer ich nie widzi (zasada z v13). */
export function widziPieniadzeTransakcji(user: Kto, deal: ZOpiekunem): boolean {
  return user.role === "owner" || deal.agent_id === user.id;
}

/** Edycja karty transakcji: opiekun transakcji albo CEO. */
export function mozeEdytowacTransakcje(user: Kto, deal: ZOpiekunem): boolean {
  return user.role === "owner" || deal.agent_id === user.id;
}

/** Raporty finansowe całego biura. */
export function widziRaportyBiura(user: Kto): boolean {
  return user.role === "owner";
}

/** Czy przed tą osobą ukrywamy kontakt do klienta (ustawienie biura „ukryj kontakty”). */
export function ukryjKontakt(user: Kto, ukrywanieWlaczone: boolean, rekord: ZOpiekunem): boolean {
  return ukrywanieWlaczone && user.role === "agent" && rekord.agent_id !== user.id;
}

/**
 * Lista klientów do wyborów w formularzach. Przy ukrywaniu kontaktów numer
 * cudzego klienta nie może trafić do przeglądarki, nawet w ukrytym polu.
 * Telefon zostaje pusty, a serwer i tak dobiera go z bazy przy zapisie.
 */
export function bezCudzychTelefonow<T extends { agent_id?: string | null; phone: string | null }>(
  lista: T[],
  user: Kto,
  ukrywanieWlaczone: boolean,
): T[] {
  if (!ukrywanieWlaczone || user.role !== "agent") return lista;
  return lista.map((c) => (ukryjKontakt(user, true, c) ? { ...c, phone: null } : c));
}

/** Usunięcie działania: autor, przypisana osoba albo CEO/menedżer. */
export function mozeUsunacDzialanie(
  user: Kto,
  dzialanie: { created_by?: string | null; assignee_ids?: string[] | null },
): boolean {
  return zarzadza(user) || dzialanie.created_by === user.id || (dzialanie.assignee_ids ?? []).includes(user.id);
}
