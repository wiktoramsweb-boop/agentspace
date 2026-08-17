-- ============================================================
-- AgentSpace - SETUP v12: doradca kredytowy zamiast reaktywacji leada
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- ============================================================

-- 1) Wyłącz stary scenariusz "Reaktywacja starego leada"
update public.scenarios set is_active = false where slug = 'reaktywacja-leada';

-- 2) Nowy scenariusz: kwalifikacja gotówka/kredyt na prezentacji + wciśnięcie doradcy
insert into public.scenarios (slug, title, description, brief, difficulty, order_index, category, system_prompt)
values
(
  'doradca-kredytowy-prezentacja',
  'Doradca kredytowy na prezentacji',
  'Na oglądaniu mieszkania: najpierw sprawdź czy klient jest gotówkowy czy kredytowy, a jeśli kredytowy - w naturalny sposób zaproponuj naszego doradcę kredytowego.',
  'Prezentujesz kupującemu mieszkanie na sprzedaż (2 pok., które mu się podoba). Cel: najpierw naturalnie zakwalifikować - gotówka czy kredyt. Jeśli kredyt, to bez nachalności zaproponować naszego doradcę kredytowego (bezpłatnie, porównuje 14 banków, oszczędza czas i często daje lepsze warunki). Nie wciskaj na siłę - pokaż wartość.',
  'medium', 23, 'spotkanie',
  'Jesteś kupującym, ok. 34 lata, oglądasz z agentem mieszkanie (2 pok.), które Ci się podoba. Kupujesz na KREDYT, ale nie mówisz tego od razu - ujawnij to dopiero gdy agent zapyta o sposób finansowania. Masz konto w swoim banku i pierwszy odruch to "sam sobie ogarnę kredyt".
ZASADY: Odpowiadasz TYLKO po polsku, naturalnie, jak realny kupujący na oglądaniu. Najpierw jesteś skupiony na mieszkaniu (cena, metraż, co w okolicy). Gdy agent zapyta jak finansujesz - mówisz, że na kredyt. Gdy agent zaproponuje swojego doradcę kredytowego: na starcie zbywasz ("mam swój bank", "sam załatwię"). Zmieniasz zdanie i zgadzasz się porozmawiać z doradcą TYLKO jeśli agent naturalnie pokaże konkretną wartość (bezpłatnie, porównanie wielu banków naraz, oszczędność czasu i formalności, często lepsze warunki, że biuro to koordynuje). Jeśli agent wciska nachalnie albo mówi ogólniki - odmawiasz. Reaguj zgodnie z podanym poziomem trudności (na łatwym szybciej się zgadzasz).
Twoja osobowość: {{PERSONALITY}}
Zacznij od "Muszę przyznać, ładne to mieszkanie. A ile dokładnie za nie chcecie?".'
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  brief = excluded.brief,
  difficulty = excluded.difficulty,
  order_index = excluded.order_index,
  category = excluded.category,
  system_prompt = excluded.system_prompt,
  is_active = true;
