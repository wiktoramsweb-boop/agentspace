-- v43: rodzaj dokumentu i korekty.
--
-- Do tej pory każdy dokument z modułu był fakturą. Nie dało się wystawić
-- proformy (dokument do zapłaty z góry, który NIE jest fakturą i nie wchodzi
-- do ewidencji sprzedaży) ani korekty (poprawia dokument już wystawiony
-- i musi się do niego odwoływać).
--
-- Statusu płatności celowo NIE trzymamy w kolumnie: liczy się go z kwoty
-- zapłaconej i terminu, więc "po terminie" pojawia się samo następnego dnia,
-- bez żadnego zadania w tle i bez ryzyka, że ktoś zapomni zmienić pole.

alter table public.invoices
  -- faktura | proforma | korekta
  add column if not exists doc_type text not null default 'faktura',
  -- Dokument pierwotny, gdy to korekta.
  add column if not exists corrects_invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists correction_reason text;

create index if not exists invoices_doc_type_idx on public.invoices(agency_id, doc_type, created_at desc);
create index if not exists invoices_corrects_idx on public.invoices(corrects_invoice_id);

comment on column public.invoices.doc_type is
  'faktura | proforma | korekta. Proforma nie wchodzi do ewidencji sprzedaży.';
comment on column public.invoices.corrects_invoice_id is 'Faktura pierwotna korygowana tym dokumentem.';
