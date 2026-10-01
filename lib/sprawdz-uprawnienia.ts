/**
 * Kontrola reguł uprawnień: `npm run test:uprawnienia`.
 *
 * Pilnuje zasad z lib/uprawnienia.ts: agent nie usuwa i nie przejmuje cudzych
 * rekordów, menedżer nie widzi pieniędzy cudzych transakcji, a ukrywanie
 * kontaktów dotyczy tylko agentów i tylko cudzych klientów.
 */
import {
  bezCudzychTelefonow, mozeEdytowacTransakcje, mozePrzepisac, mozeUsunac,
  mozeUsunacDzialanie, ukryjKontakt, widziPieniadzeTransakcji, widziRaportyBiura,
} from "./uprawnienia.ts";

const bledy: string[] = [];
function sprawdz(nazwa: string, warunek: boolean) {
  if (!warunek) bledy.push(nazwa);
}

const ceo = { id: "ceo", role: "owner", agency_id: "b1" };
const menedzer = { id: "men", role: "manager", agency_id: "b1" };
const agent = { id: "a1", role: "agent", agency_id: "b1" };
const moj = { agent_id: "a1" };
const cudzy = { agent_id: "a2" };
const pula = { agent_id: null };

// Usuwanie
sprawdz("agent usuwa swojego klienta", mozeUsunac(agent, moj));
sprawdz("agent NIE usuwa cudzego klienta", !mozeUsunac(agent, cudzy));
sprawdz("agent NIE usuwa rekordu z puli", !mozeUsunac(agent, pula));
sprawdz("CEO usuwa cudzego klienta", mozeUsunac(ceo, cudzy));
sprawdz("menedżer usuwa cudzego klienta", mozeUsunac(menedzer, cudzy));

// Przepisywanie
sprawdz("agent oddaje swojego klienta", mozePrzepisac(agent, moj));
sprawdz("agent bierze klienta z puli", mozePrzepisac(agent, pula));
sprawdz("agent NIE zabiera klienta koledze", !mozePrzepisac(agent, cudzy));
sprawdz("menedżer przepisuje cudzego klienta", mozePrzepisac(menedzer, cudzy));

// Działania
sprawdz("autor usuwa swoje działanie", mozeUsunacDzialanie(agent, { created_by: "a1", assignee_ids: ["a2"] }));
sprawdz("przypisany usuwa działanie", mozeUsunacDzialanie(agent, { created_by: "a2", assignee_ids: ["a1"] }));
sprawdz("agent NIE usuwa cudzego działania", !mozeUsunacDzialanie(agent, { created_by: "a2", assignee_ids: ["a3"] }));
sprawdz("CEO usuwa każde działanie", mozeUsunacDzialanie(ceo, { created_by: "a2", assignee_ids: [] }));

// Pieniądze i transakcje
sprawdz("agent widzi kwoty swojej transakcji", widziPieniadzeTransakcji(agent, moj));
sprawdz("agent NIE widzi kwot cudzej transakcji", !widziPieniadzeTransakcji(agent, cudzy));
sprawdz("menedżer NIE widzi kwot cudzej transakcji", !widziPieniadzeTransakcji(menedzer, cudzy));
sprawdz("CEO widzi kwoty każdej transakcji", widziPieniadzeTransakcji(ceo, cudzy));
sprawdz("agent NIE edytuje cudzej karty", !mozeEdytowacTransakcje(agent, cudzy));
sprawdz("CEO edytuje kartę agenta", mozeEdytowacTransakcje(ceo, cudzy));
sprawdz("raporty biura tylko dla CEO", widziRaportyBiura(ceo) && !widziRaportyBiura(menedzer) && !widziRaportyBiura(agent));

// Ukrywanie kontaktów
sprawdz("bez ustawienia nic nie ukrywamy", !ukryjKontakt(agent, false, cudzy));
sprawdz("agent nie widzi kontaktu cudzego klienta", ukryjKontakt(agent, true, cudzy));
sprawdz("agent widzi kontakt swojego klienta", !ukryjKontakt(agent, true, moj));
sprawdz("CEO zawsze widzi kontakt", !ukryjKontakt(ceo, true, cudzy));

const lista = [
  { id: "k1", agent_id: "a1", phone: "600100200" },
  { id: "k2", agent_id: "a2", phone: "600300400" },
];
const dlaAgenta = bezCudzychTelefonow(lista, agent, true);
sprawdz("lista: swój numer zostaje", dlaAgenta[0].phone === "600100200");
sprawdz("lista: cudzy numer nie trafia do przeglądarki", dlaAgenta[1].phone === null);
sprawdz("lista: CEO dostaje pełne numery", bezCudzychTelefonow(lista, ceo, true)[1].phone === "600300400");

if (bledy.length) {
  console.error("Uprawnienia - błędy:\n- " + bledy.join("\n- "));
  process.exit(1);
}
console.log("Uprawnienia: wszystkie sprawdzenia przeszły.");
