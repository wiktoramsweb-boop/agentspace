"use client";

import { useRef } from "react";
import type { CompanyData } from "@/lib/agency-settings";
import { saveCompany } from "../company-actions";
import { FieldLabel, Fieldset, ResultForm, inputCls } from "../result-form";

const VOIVODESHIPS = [
  "Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie", "Łódzkie", "Małopolskie",
  "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie",
  "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie",
];

export function CompanyForm({ company, disabled }: { company: CompanyData; disabled: boolean }) {
  const formRef = useRef<HTMLDivElement>(null);

  /** Adres korespondencyjny najczęściej jest taki sam jak siedziba. */
  function copyAddress() {
    const root = formRef.current;
    if (!root) return;
    const get = (n: string) => (root.querySelector(`[name="${n}"]`) as HTMLInputElement | null)?.value ?? "";
    const set = (n: string, v: string) => {
      const el = root.querySelector(`[name="${n}"]`) as HTMLInputElement | null;
      if (el) el.value = v;
    };
    set("corr_name", get("name"));
    set("corr_street", get("street"));
    set("corr_postal_code", get("postal_code"));
    set("corr_city", get("city"));
  }

  return (
    <ResultForm action={saveCompany} disabled={disabled}>
      <div ref={formRef} className="space-y-6">
        <Fieldset title="Dane firmy">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <FieldLabel required>Nazwa firmy</FieldLabel>
              <input name="name" required defaultValue={company.name ?? ""} className={inputCls}
                placeholder="Agencja Nieruchomości Spectra s.c." />
            </label>
            <label>
              <FieldLabel>Ulica i numer</FieldLabel>
              <input name="street" defaultValue={company.street ?? ""} className={inputCls} placeholder="Zbożowa 2/1" />
            </label>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <label>
                <FieldLabel>Kod pocztowy</FieldLabel>
                <input name="postal_code" defaultValue={company.postal_code ?? ""} className={inputCls}
                  placeholder="30-002" inputMode="numeric" pattern="\d{2}-?\d{3}" title="Format 00-000" />
              </label>
              <label>
                <FieldLabel>Miasto</FieldLabel>
                <input name="city" defaultValue={company.city ?? ""} className={inputCls} placeholder="Kraków" />
              </label>
            </div>
            <label>
              <FieldLabel>Państwo</FieldLabel>
              <select name="country" defaultValue={company.country ?? "Polska"} className={inputCls}>
                {["Polska", "Niemcy", "Czechy", "Słowacja", "Wielka Brytania", "Inne"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Województwo</FieldLabel>
              <select name="voivodeship" defaultValue={company.voivodeship ?? ""} className={inputCls}>
                <option value="">wybierz…</option>
                {VOIVODESHIPS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel required>Telefon</FieldLabel>
              <input name="phone" required type="tel" defaultValue={company.phone ?? ""} className={inputCls}
                placeholder="790 408 034" />
            </label>
            <label>
              <FieldLabel required>E-mail biura</FieldLabel>
              <input name="email" required type="email" defaultValue={company.email ?? ""} className={inputCls}
                placeholder="biuro@twojbiuro.pl" />
            </label>
            <label>
              <FieldLabel required>NIP</FieldLabel>
              <input name="nip" required defaultValue={company.nip ?? ""} className={inputCls}
                placeholder="6772516327" inputMode="numeric" />
            </label>
            <label>
              <FieldLabel>WWW</FieldLabel>
              <input name="www" type="url" defaultValue={company.www ?? ""} className={inputCls}
                placeholder="https://twojbiuro.pl" />
            </label>
          </div>
        </Fieldset>

        <Fieldset
          title="Adres korespondencyjny"
          aside={
            <button type="button" onClick={copyAddress}
              className="ml-2 rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
              Taki sam jak siedziba
            </button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <FieldLabel>Nazwa firmy / adresat</FieldLabel>
              <input name="corr_name" defaultValue={company.corr_name ?? ""} className={inputCls} />
            </label>
            <label>
              <FieldLabel>Ulica i numer</FieldLabel>
              <input name="corr_street" defaultValue={company.corr_street ?? ""} className={inputCls} />
            </label>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <label>
                <FieldLabel>Kod pocztowy</FieldLabel>
                <input name="corr_postal_code" defaultValue={company.corr_postal_code ?? ""} className={inputCls} />
              </label>
              <label>
                <FieldLabel>Miasto</FieldLabel>
                <input name="corr_city" defaultValue={company.corr_city ?? ""} className={inputCls} />
              </label>
            </div>
          </div>
        </Fieldset>
      </div>
    </ResultForm>
  );
}
