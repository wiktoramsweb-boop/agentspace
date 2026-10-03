-- v42: stawki VAT na fakturach.
--
-- Do tej pory moduł faktur znał wyłącznie zwolnienie podmiotowe z art. 113,
-- czyli działał dla jednoosobowej działalności poniżej limitu i dla nikogo
-- więcej. Biuro będące czynnym podatnikiem VAT nie mogło wystawić faktury
-- zgodnej z przepisami.
--
-- Same stawki pozycji jadą w kolumnie `items` (jsonb), więc nie wymagają
-- zmiany schematu. Tutaj dokładamy to, co musi być policzone dla całej
-- faktury: tryb cen oraz rozbicie na netto i podatek.
--
-- `total_pln` zostaje kwotą DO ZAPŁATY (brutto) - tak było dotąd i tak liczy
-- to reszta aplikacji. Przy fakturach "zw" netto równa się brutto, więc
-- dotychczasowe dokumenty pozostają poprawne bez przeliczania.

alter table public.invoices
  -- 'netto' albo 'brutto': w jakim trybie podano ceny jednostkowe.
  add column if not exists prices_mode text not null default 'netto',
  add column if not exists net_pln numeric not null default 0,
  add column if not exists vat_pln numeric not null default 0;

-- Faktury sprzed tej zmiany były zwolnione z VAT, więc netto = brutto.
update public.invoices
   set net_pln = total_pln
 where net_pln = 0 and total_pln <> 0;

comment on column public.invoices.prices_mode is
  'netto | brutto - w jakim trybie wpisano ceny jednostkowe pozycji.';
comment on column public.invoices.net_pln is 'Suma netto. Przy fakturze zwolnionej równa total_pln.';
comment on column public.invoices.vat_pln is 'Suma podatku. Przy fakturze zwolnionej zero.';
