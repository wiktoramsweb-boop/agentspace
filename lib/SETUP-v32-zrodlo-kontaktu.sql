-- v32: skąd przyszedł nadawca wiadomości z formularza kontaktowego
--
-- Pierwszy lead przyszedł od właścicielki biura i nie dało się ustalić, skąd
-- nas znalazła, bo formularz zapisywał tylko treść. Teraz razem z wiadomością
-- leci referrer, parametry kampanii i podstrona, na którą ktoś wszedł jako
-- pierwszą. Bez tego nie da się powiedzieć, który kanał przynosi klientów.

alter table contact_messages add column if not exists zrodlo text;
