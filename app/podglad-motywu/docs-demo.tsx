"use client";

import { DocumentsCard } from "../app/dokumenty/documents-card";
import { ClientCorrespondence } from "../app/klienci/[id]/client-correspondence";

/** Przykładowe dokumenty i korespondencja do podglądu (tylko tryb deweloperski). */
export function DocsDemo() {
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Dokumenty (3)</h2>
        <DocumentsCard
          entity="property"
          entityId="demo"
          ready
          initial={[
            { id: "d1", kind: "umowa_posrednictwa", name: "Umowa pośrednictwa - Sołtysowska.pdf", size_bytes: 482_000, mime: "application/pdf", created_at: ago(30), uploaderName: "Wiktor Szostek" },
            { id: "d2", kind: "rzut", name: "rzut-mieszkania.jpg", size_bytes: 1_240_000, mime: "image/jpeg", created_at: ago(50), uploaderName: "Natalia Grygiel" },
            { id: "d3", kind: "inne", name: "Zestawienie opłat.xlsx", size_bytes: 23_000, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", created_at: ago(80), uploaderName: null },
          ]}
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Korespondencja (3)</h2>
        <ClientCorrespondence
          clientId="demo"
          clientEmail="klient@example.com"
          clientPhone="600100200"
          ready
          initial={[
            { id: "m1", channel: "mail", direction: "wyslana", subject: "Podsumowanie spotkania", body: "Dzień dobry Pani Małgorzato,\n\ndziękuję za dzisiejsze spotkanie. Zgodnie z ustaleniami przesyłam wstępną wycenę mieszkania przy ul. Warmijskiej oraz listę dokumentów, które będą potrzebne do sprzedaży: odpis księgi wieczystej, zaświadczenie ze spółdzielni i świadectwo energetyczne.\n\nPozdrawiam serdecznie", sent_at: ago(5), authorName: "Wiktor Szostek" },
            { id: "m2", channel: "sms", direction: "otrzymana", subject: null, body: "Dzień dobry, dziękuję. Dokumenty prześlę w czwartek.", sent_at: ago(3), authorName: "Wiktor Szostek" },
            { id: "m3", channel: "sms", direction: "wyslana", subject: null, body: "Przypominam o jutrzejszej prezentacji o 17:00, ul. Sołtysowska 12.", sent_at: ago(49), authorName: "Patrycja Gdowska" },
          ]}
        />
      </div>
    </div>
  );
}
