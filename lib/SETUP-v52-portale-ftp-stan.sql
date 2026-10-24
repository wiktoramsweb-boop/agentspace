-- v52: stan wysyłek na portale przez FTP.
-- zdjecia_wyslane: nazwy plików zdjęć, które portal już ma (nie wysyłamy ich drugi raz).
-- ostatnie_bledy: oferty, które nie poszły w ostatniej wysyłce, z powodem po polsku.
alter table public.portal_ftp add column if not exists zdjecia_wyslane jsonb not null default '[]'::jsonb;
alter table public.portal_ftp add column if not exists ostatnie_bledy jsonb not null default '[]'::jsonb;
alter table public.portal_ftp add column if not exists wysylka_start timestamptz;
