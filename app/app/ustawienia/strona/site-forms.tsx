"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extFor, uploadToSignedUrl } from "@/lib/photo-process";
import { WZORY } from "@/lib/wzory/themes";
import type { SiteConfig } from "@/lib/site/config";
import {
  saveSiteBasics,
  saveSiteContact,
  saveSiteContent,
  setSiteAsset,
  setTeamVisibility,
  moveTeamMember,
  savePost,
  deletePost,
  signSiteUpload,
  requestSiteAddon,
  saveSiteDomain,
  checkSiteDomain,
  type SiteResult,
} from "./actions";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

function Status({ res }: { res: SiteResult | null }) {
  if (!res) return null;
  return res.ok ? (
    <p className="text-sm font-medium text-emerald-600">Zapisano.</p>
  ) : (
    <p className="text-sm text-red-600">{res.error}</p>
  );
}

/* ───────────────────────── wybór wzoru i marka ───────────────────────── */

export function BasicsForm({ site, appUrl }: { site: SiteConfig; appUrl: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SiteResult | null>(null);
  const [template, setTemplate] = useState(site.template);
  const [published, setPublished] = useState(site.published);
  const [slug, setSlug] = useState(site.slug);

  return (
    <form
      className="space-y-6"
      action={(fd) => {
        fd.set("template", template);
        fd.set("published", published ? "1" : "0");
        start(async () => setRes(await saveSiteBasics(fd)));
      }}
    >
      <div>
        <p className={label}>Wzór strony</p>
        <p className="mb-3 text-sm text-slate-500">
          Klikając w kafelek zmieniasz wygląd całej strony. Treści i oferty zostają bez zmian.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WZORY.map((w) => (
            <button
              key={w.slug}
              type="button"
              onClick={() => setTemplate(w.slug)}
              className={`rounded-2xl border p-3 text-left transition ${
                template === w.slug
                  ? "border-emerald-500 ring-2 ring-emerald-500/25"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="mb-2 flex gap-1.5">
                {w.swatch.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border border-slate-200" style={{ background: c }} />
                ))}
              </span>
              <span className="block font-semibold text-slate-900">{w.name}</span>
              <span className="block text-xs text-slate-500">{w.forWhom}</span>
              <Link
                href={`/wzory/${w.slug}`}
                target="_blank"
                className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline"
              >
                Zobacz wzór →
              </Link>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="officeName">
            Nazwa biura na stronie
          </label>
          <input id="officeName" name="officeName" defaultValue={site.brand.officeName} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="claim">
            Dopisek przy nazwie
          </label>
          <input id="claim" name="claim" defaultValue={site.brand.claim} placeholder="np. Nieruchomości" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="slug">
            Adres strony
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{appUrl}/strona/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={input}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Docelowo podepniemy tu Waszą własną domenę. Ten adres działa od razu.
          </p>
        </div>
        <div>
          <label className={label} htmlFor="accent">
            Kolor wiodący
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              defaultValue={site.brand.accent || "#10b981"}
              onChange={(e) => {
                const el = document.getElementById("accent") as HTMLInputElement | null;
                if (el) el.value = e.target.value;
              }}
              className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              aria-label="Wybierz kolor"
            />
            <input id="accent" name="accent" defaultValue={site.brand.accent} placeholder="np. #C9603F" className={input} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Puste pole = kolor z wybranego wzoru.</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-emerald-500"
        />
        <span>
          <span className="block font-medium text-slate-900">Strona widoczna publicznie</span>
          <span className="block text-sm text-slate-500">
            Dopóki nie zaznaczysz, adres pokazuje stronę „nie znaleziono", a formularze nie przyjmują zgłoszeń.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję..." : "Zapisz"}
        </button>
        <Link
          href={`/strona/${slug}`}
          target="_blank"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Otwórz stronę w nowej karcie
        </Link>
        <Status res={res} />
      </div>
    </form>
  );
}

/* ───────────────────────── pliki ───────────────────────── */

export function SiteAsset({
  kind,
  title,
  hint,
  currentUrl,
}: {
  kind: "logo" | "hero";
  title: string;
  hint: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      setError("Wybierz plik PNG, JPG, WEBP albo SVG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Plik jest większy niż 10 MB.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const signed = await signSiteUpload(kind, extFor(file));
      if (signed.error || !signed.upload) throw new Error(signed.error ?? "Brak linku do wgrania.");
      await uploadToSignedUrl(signed.upload.signedUrl, file, setProgress);
      const res = await setSiteAsset(kind, signed.upload.path);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać pliku.");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-sm text-slate-500">{hint}</p>

      <div className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={title} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-400">Brak pliku</span>
        )}
      </div>

      {busy && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {currentUrl ? "Zmień" : "Wgraj"}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await setSiteAsset(kind, null);
              if (!res.ok) setError(res.error);
              else router.refresh();
              setBusy(false);
            }}
            className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Usuń
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/* ───────────────────────── kontakt ───────────────────────── */

export function ContactForm({ site }: { site: SiteConfig }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SiteResult | null>(null);
  const c = site.contact;

  const fields: [keyof typeof c, string, string][] = [
    ["phone", "Telefon", "12 430 10 20"],
    ["email", "E-mail", "biuro@twojebiuro.pl"],
    ["addressLine", "Ulica i numer", "ul. Starowiślna 18/3"],
    ["addressCity", "Kod i miasto", "31-032 Kraków"],
    ["hours", "Godziny pracy", "Poniedziałek do piątku, 9:00 do 17:00"],
    ["nip", "NIP", "NIP 676 000 00 00"],
    ["facebook", "Facebook", "https://facebook.com/twojebiuro"],
    ["instagram", "Instagram", "https://instagram.com/twojebiuro"],
  ];

  return (
    <form className="space-y-5" action={(fd) => start(async () => setRes(await saveSiteContact(fd)))}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, l, ph]) => (
          <div key={k}>
            <label className={label} htmlFor={k}>
              {l}
            </label>
            <input id={k} name={k} defaultValue={c[k]} placeholder={ph} className={input} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję..." : "Zapisz kontakt"}
        </button>
        <Status res={res} />
      </div>
    </form>
  );
}

/* ───────────────────────── treści ───────────────────────── */

export function ContentForm({ site }: { site: SiteConfig }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SiteResult | null>(null);
  const c = site.content;
  const stats = [...c.stats, ...Array(4).fill({ value: "", label: "" })].slice(0, 4);
  const reasons = [...c.reasons, ...Array(3).fill({ title: "", body: "" })].slice(0, 3);
  const reviews = [...c.reviews, ...Array(4).fill({ text: "", who: "", what: "" })].slice(0, 4);

  return (
    <form className="space-y-8" action={(fd) => start(async () => setRes(await saveSiteContent(fd)))}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Nagłówek strony głównej</h2>
        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="heroKick">
              Nadtytuł
            </label>
            <input id="heroKick" name="heroKick" defaultValue={c.heroKick} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="heroTitle">
              Główne zdanie
            </label>
            <input id="heroTitle" name="heroTitle" defaultValue={c.heroTitle} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="heroLead">
              Akapit pod nagłówkiem
            </label>
            <textarea id="heroLead" name="heroLead" rows={3} defaultValue={c.heroLead} className={input} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Liczby</h2>
        <p className="mb-4 text-sm text-slate-500">Puste pola nie pokażą się na stronie.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((s, i) => (
            <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
              <input name={`stat_value_${i}`} defaultValue={s.value} placeholder="128" className={input} />
              <input name={`stat_label_${i}`} defaultValue={s.label} placeholder="transakcji w 2025" className={input} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Dlaczego my</h2>
        <div className="space-y-4">
          {reasons.map((r, i) => (
            <div key={i} className="grid gap-2">
              <input name={`reason_title_${i}`} defaultValue={r.title} placeholder="Tytuł powodu" className={input} />
              <textarea name={`reason_body_${i}`} rows={2} defaultValue={r.body} placeholder="Krótkie wyjaśnienie" className={input} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">O biurze</h2>
        <div className="space-y-4">
          <input name="aboutTitle" defaultValue={c.aboutTitle} placeholder="Tytuł sekcji" className={input} />
          <textarea
            name="aboutBody"
            rows={7}
            defaultValue={c.aboutBody}
            placeholder="Kilka akapitów o biurze. Pusty wiersz oddziela akapity."
            className={input}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Opinie klientów</h2>
        <p className="mb-4 text-sm text-slate-500">
          Wpisz prawdziwe opinie, na przykład przepisane z Google. Pokażą się na przewijanym pasku.
        </p>
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div key={i} className="grid gap-2">
              <textarea name={`review_text_${i}`} rows={2} defaultValue={r.text} placeholder="Treść opinii" className={input} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name={`review_who_${i}`} defaultValue={r.who} placeholder="Kto (np. Anna K.)" className={input} />
                <input name={`review_what_${i}`} defaultValue={r.what} placeholder="Czego dotyczyła (np. sprzedaż mieszkania)" className={input} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Zaproszenie do kontaktu</h2>
        <div className="space-y-4">
          <input name="ctaTitle" defaultValue={c.ctaTitle} placeholder="Tytuł" className={input} />
          <textarea name="ctaLead" rows={3} defaultValue={c.ctaLead} placeholder="Zachęta do kontaktu" className={input} />
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję..." : "Zapisz treści"}
        </button>
        <Status res={res} />
      </div>
    </form>
  );
}

/* ───────────────────────── zespół ───────────────────────── */

export type TeamRow = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  photo: string | null;
  bio: string | null;
  show: boolean;
};

export function TeamOnSite({ rows }: { rows: TeamRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<SiteResult>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {rows.map((m, i) => (
        <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          {m.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo} alt={m.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
              brak
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{m.name}</p>
            <p className="text-sm text-slate-500">
              {m.role || "Bez stanowiska"} {m.phone ? `· ${m.phone}` : ""}
            </p>
            {!m.bio && <p className="mt-1 text-xs text-amber-600">Brak opisu. Agent uzupełnia go w Ustawieniach.</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending || i === 0}
              onClick={() => run(() => moveTeamMember(m.id, -1))}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              aria-label="W górę"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === rows.length - 1}
              onClick={() => run(() => moveTeamMember(m.id, 1))}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              aria-label="W dół"
            >
              ↓
            </button>
            <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={m.show}
                disabled={pending}
                onChange={(e) => run(() => setTeamVisibility(m.id, e.target.checked))}
                className="h-5 w-5 accent-emerald-500"
              />
              Na stronie
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── wpisy ───────────────────────── */

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  body: string | null;
  tag: string | null;
  author: string | null;
  read_min: number | null;
  published: boolean;
  published_at: string | null;
};

export function PostsEditor({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PostRow | "new" | null>(null);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SiteResult | null>(null);

  const blank: PostRow = {
    id: "",
    slug: "",
    title: "",
    lead: "",
    body: "",
    tag: "Poradnik",
    author: "",
    read_min: 4,
    published: false,
    published_at: new Date().toISOString().slice(0, 10),
  };
  const current = editing === "new" ? blank : editing;

  return (
    <div className="space-y-5">
      {!current && (
        <>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
          >
            + Nowy wpis
          </button>

          <div className="space-y-2">
            {posts.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Nie masz jeszcze żadnego wpisu. Poradnik to najtańszy sposób, żeby strona zaczęła się pokazywać w Google.
              </p>
            )}
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <p className="text-sm text-slate-500">
                    {p.published ? "Opublikowany" : "Szkic"} · {p.published_at ?? ""} · /{p.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Usunąć wpis „${p.title}"?`)) return;
                    start(async () => {
                      await deletePost(p.id);
                      router.refresh();
                    });
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Usuń
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {current && (
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
          action={(fd) => {
            start(async () => {
              const r = await savePost(fd);
              setRes(r);
              if (r.ok) {
                setEditing(null);
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="id" value={current.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="title">
                Tytuł
              </label>
              <input id="title" name="title" defaultValue={current.title} required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="slug">
                Adres wpisu
              </label>
              <input id="slug" name="slug" defaultValue={current.slug} placeholder="zostaw puste, wypełni się z tytułu" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="tag">
                Kategoria
              </label>
              <input id="tag" name="tag" defaultValue={current.tag ?? "Poradnik"} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="author">
                Autor
              </label>
              <input id="author" name="author" defaultValue={current.author ?? ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="published_at">
                Data
              </label>
              <input id="published_at" name="published_at" type="date" defaultValue={current.published_at ?? ""} className={input} />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="lead">
              Zajawka
            </label>
            <textarea id="lead" name="lead" rows={2} defaultValue={current.lead ?? ""} className={input} />
          </div>

          <div>
            <label className={label} htmlFor="body">
              Treść
            </label>
            <textarea
              id="body"
              name="body"
              rows={14}
              defaultValue={current.body ?? ""}
              placeholder={"Pusty wiersz oddziela akapity.\n\n## Tak zaczynasz śródtytuł\nA pod nim piszesz dalej."}
              className={`${input} font-mono text-sm`}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Wiersz zaczynający się od dwóch znaków # jest śródtytułem. Reszta to zwykłe akapity.
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" name="published" value="1" defaultChecked={current.published} className="h-5 w-5 accent-emerald-500" />
            Opublikowany na stronie
          </label>

          <input type="hidden" name="read_min" value={current.read_min ?? 4} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {pending ? "Zapisuję..." : "Zapisz wpis"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setRes(null);
              }}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Anuluj
            </button>
            <Status res={res} />
          </div>
        </form>
      )}
    </div>
  );
}

/* ───────────────────────── dodatek: oferta dla biur bez strony ───────────────────────── */

export function AddonOffer({
  price,
  yearly,
  setup,
  includes,
  requestedAt,
  wzory,
}: {
  price: number;
  yearly: number;
  setup: number;
  includes: [string, string][];
  requestedAt: string | null;
  wzory: { slug: string; name: string; forWhom: string; swatch: string[] }[];
}) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const zl = (n: number) => new Intl.NumberFormat("pl-PL").format(n) + " zł";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Dodatek</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Strona internetowa biura</h1>
          <p className="mt-2 max-w-[70ch] text-sm text-slate-600">
            To osobna usługa, poza abonamentem za system. Jeśli ją włączycie, tutaj pojawi się pełna konfiguracja:
            wybór wzoru, kolory, logo, wszystkie teksty, zespół i poradnik. Do tego czasu system działa bez zmian.
          </p>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {includes.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-1.5 font-semibold text-slate-900">{t}</h3>
                <p className="text-sm text-slate-500">{d}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 lg:self-start">
            <p className="text-sm text-slate-600">Abonament miesięczny</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {zl(price)}
              <span className="text-base font-normal text-slate-500"> /mc</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              albo {zl(yearly)} za rok, czyli dwa miesiące gratis
            </p>
            <p className="mt-4 border-t border-emerald-200 pt-4 text-sm text-slate-600">
              Wdrożenie {zl(setup)} jednorazowo: przeniesienie treści, zdjęcia, podpięcie domeny i ustawienie
              wszystkiego pod Wasze biuro.
            </p>

            {requestedAt || sent ? (
              <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-emerald-700">
                Zgłoszenie przyjęte. Odezwiemy się, żeby ustalić szczegóły i termin.
              </p>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await requestSiteAddon();
                    if (res.ok) setSent(true);
                  })
                }
                className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {pending ? "Wysyłam..." : "Chcę stronę dla biura"}
              </button>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Bez zobowiązania. Najpierw pokażemy podgląd na Waszych ofertach i logo.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Wzory do wyboru</h2>
        <p className="mb-4 text-sm text-slate-500">Kliknij, żeby obejrzeć całą stronę na przykładowych danych.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {wzory.map((w) => (
            <Link
              key={w.slug}
              href={`/wzory/${w.slug}`}
              target="_blank"
              className="rounded-2xl border border-slate-200 p-3 transition hover:border-emerald-400 hover:shadow-sm"
            >
              <span className="mb-2 flex gap-1.5">
                {w.swatch.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border border-slate-200" style={{ background: c }} />
                ))}
              </span>
              <span className="block font-semibold text-slate-900">{w.name}</span>
              <span className="block text-xs text-slate-500">{w.forWhom}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── własna domena ───────────────────────── */

const DOMAIN_LABEL: Record<string, string> = {
  brak: "Brak własnej domeny",
  czeka_na_dns: "Czeka na wpisy DNS",
  dodana_do_hostingu: "Dodana do hostingu, czeka na DNS",
  dziala: "Działa",
};

export function DomainForm({ domain, status, slug }: { domain: string | null; status: string; slug: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SiteResult | null>(null);
  const [check, setCheck] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <form
        className="space-y-4"
        action={(fd) => {
          setCheck(null);
          start(async () => setRes(await saveSiteDomain(fd)));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label className={label} htmlFor="domain">
              Adres Waszej domeny
            </label>
            <input id="domain" name="domain" defaultValue={domain ?? ""} placeholder="np. twojebiuro.pl" className={input} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Zapisuję..." : "Zapisz domenę"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              status === "dziala" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {DOMAIN_LABEL[status] ?? status}
          </span>
          {domain && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await checkSiteDomain();
                  setCheck(r.message);
                })
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sprawdź teraz
            </button>
          )}
          <Status res={res} />
          {check && <span className="text-sm text-slate-600">{check}</span>}
        </div>
      </form>

      <div className="rounded-2xl bg-slate-50 p-5">
        <h3 className="mb-2 font-semibold text-slate-900">Co ustawić u rejestratora domeny</h3>
        <p className="mb-3 text-sm text-slate-600">
          Wejdź tam, gdzie kupiłeś domenę (na przykład OVH, home.pl, nazwa.pl), znajdź ustawienia DNS i dodaj dwa
          wpisy. Jeśli coś tam już jest dla tych nazw, podmień wartości.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2">Typ</th>
                <th className="py-2">Nazwa</th>
                <th className="py-2">Wartość</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-t border-slate-200">
                <td className="py-2">A</td>
                <td className="py-2">@</td>
                <td className="py-2">76.76.21.21</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-2">CNAME</td>
                <td className="py-2">www</td>
                <td className="py-2">cname.vercel-dns.com</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Zmiany w DNS wchodzą zwykle w kilkanaście minut, czasem do doby. Certyfikat wystawiamy automatycznie. Do
          tego czasu strona działa pod adresem /strona/{slug}.
        </p>
      </div>
    </div>
  );
}
