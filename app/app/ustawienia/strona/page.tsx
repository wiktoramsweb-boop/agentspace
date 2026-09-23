import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site/config";
import { getAddonState, SITE_ADDON, SITE_ADDON_INCLUDES } from "@/lib/site/addon";
import { siteOffers } from "@/lib/site/data";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { APP_URL } from "@/lib/supabase/config";
import { WZORY } from "@/lib/wzory/themes";
import { AddonOffer, BasicsForm, ContactForm, DomainForm, SiteAsset } from "./site-forms";

export default async function StronaPage() {
  const owner = await requireOwner();
  const [site, addon] = await Promise.all([
    getSiteConfig(owner.agency_id!, owner.agency?.name ?? "Biuro"),
    getAddonState(owner.agency_id!),
  ]);

  // Strona www to osobna usługa. Bez niej pokazujemy opis dodatku zamiast
  // konfiguracji, żeby nikt nie ustawiał czegoś, czego i tak nie zobaczy.
  if (!addon.active) {
    return (
      <AddonOffer
        price={SITE_ADDON.monthly}
        yearly={SITE_ADDON.yearly}
        setup={SITE_ADDON.setup}
        includes={SITE_ADDON_INCLUDES}
        requestedAt={addon.requestedAt}
        wzory={WZORY.map((w) => ({ slug: w.slug, name: w.name, forWhom: w.forWhom, swatch: [...w.swatch] }))}
      />
    );
  }

  const offers = await siteOffers(owner.agency_id!);
  const logoUrl = site.brand.logoPath ? publicAssetUrl(ASSET_BUCKET, site.brand.logoPath) : null;
  const heroUrl = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : null;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Strona internetowa biura</h1>
            <p className="mt-1 text-sm text-slate-500">
              Wybierasz wzór, wpisujesz teksty, a oferty i zespół strona bierze prosto z systemu.
            </p>
          </div>
          <span
            className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
              site.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {site.published ? "Opublikowana" : "Szkic, niewidoczna"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-mono text-xl font-semibold text-slate-900">{offers.length}</p>
            <p className="text-sm text-slate-500">
              ofert trafia na stronę.{" "}
              <Link href="/app/nieruchomosci" className="text-emerald-600 hover:underline">
                Zaznacz w ofercie publikację
              </Link>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="truncate font-mono text-xl font-semibold text-slate-900">{site.domain ?? site.slug}</p>
            <p className="text-sm text-slate-500">{site.domain ? "własna domena" : "adres tymczasowy"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-mono text-xl font-semibold text-slate-900">{site.template}</p>
            <p className="text-sm text-slate-500">wybrany wzór</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Wygląd i adres</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <BasicsForm site={site} appUrl={APP_URL.replace(/^https?:\/\//, "")} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <SiteAsset
          kind="logo"
          title="Logo na stronie"
          hint="PNG z przezroczystym tłem albo SVG. Jeśli nie wgrasz, pokażemy nazwę biura tekstem."
          currentUrl={logoUrl}
        />
        <SiteAsset
          kind="hero"
          title="Zdjęcie w nagłówku"
          hint="Szerokie zdjęcie miasta albo Waszego biura. Widać je na stronie głównej i w sekcji o nas."
          currentUrl={heroUrl}
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Własna domena</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <DomainForm domain={site.domain} status={site.domainStatus} slug={site.slug} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Dane kontaktowe</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <ContactForm site={site} />
        </div>
      </section>
    </div>
  );
}
