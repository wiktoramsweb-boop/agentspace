-- v45: ręczny status płatności faktury.
--
-- Status liczył się sam z kwoty zapłaconej i terminu. Działa, ale nie widać,
-- skąd się bierze, i nie da się go po prostu ustawić - a to jest pierwsza
-- rzecz, której ktoś szuka po otrzymaniu przelewu.
--
-- Kolumna pusta oznacza "licz automatycznie", czyli zachowanie dotychczasowe.
-- Wartość ustawiona ręcznie ma pierwszeństwo.

alter table public.invoices
  add column if not exists payment_status text;

comment on column public.invoices.payment_status is
  'zaplacona | nieoplacona. NULL = licz automatycznie z paid_pln i payment_date.';
