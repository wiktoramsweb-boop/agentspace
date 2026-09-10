"use client";

import { useState } from "react";
import { PHOTO_SIZES, type AgencyOptions } from "@/lib/agency-settings-shared";
import { saveOptions } from "../company-actions";
import { FieldLabel, Fieldset, ResultForm, inputCls } from "../result-form";

export function OptionsForm({ options, disabled }: { options: AgencyOptions; disabled: boolean }) {
  const [prefix, setPrefix] = useState(options.offer_prefix);
  const [auto, setAuto] = useState(options.auto_numbering);
  const year = new Date().getFullYear();

  return (
    <ResultForm action={saveOptions} disabled={disabled}>
      <div className="grid gap-6 xl:grid-cols-2">
        <Fieldset title="Zdjęcia">
          <label className="block">
            <FieldLabel>Maksymalny rozmiar zdjęć dodawanych w programie</FieldLabel>
            <select name="photo_max" defaultValue={options.photo_max} className={inputCls}>
              {PHOTO_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500">
            Większe zdjęcia zmniejszamy przed wysłaniem. Agent w terenie wysyła wtedy
            kilkanaście razy mniej danych, a portale i tak nie przyjmują większych.
          </p>
        </Fieldset>

        <Fieldset title="Prywatność bazy">
          <Check
            name="hide_contacts"
            defaultChecked={options.hide_contacts}
            label="Ukryj e-maile i telefony klientów na listach"
            hint="Dotyczy listy klientów, listy działań i wyszukiwarki. Agent widzi pełne dane tylko swoich klientów, CEO i menedżerowie wszystko. Sprawdzenie, czy numer jest już w bazie, działa dalej."
          />
        </Fieldset>

        <Fieldset title="Numeracja ofert">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="auto_numbering"
              value="1"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            <span className="text-sm text-slate-800">Automatyczne numerowanie według maski</span>
          </label>
          <div className="grid grid-cols-[140px_1fr] items-end gap-4">
            <label className="block">
              <FieldLabel>Prefiks</FieldLabel>
              <input
                name="offer_prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                disabled={!auto}
                className={`${inputCls} font-mono uppercase disabled:bg-slate-100 disabled:text-slate-400`}
              />
            </label>
            <p className="pb-2.5 text-sm text-slate-500">
              Następna oferta:{" "}
              <span className="font-mono font-semibold text-slate-900">
                {auto ? `${prefix || "OF"}/${year}/001` : "bez numeru"}
              </span>
            </p>
          </div>
          <p className="text-xs text-slate-500">Licznik zaczyna się od nowa w każdym roku, osobno dla biura.</p>
        </Fieldset>

        <Fieldset title="Działania">
          <Check
            name="report_default"
            defaultChecked={options.report_default}
            label={'Domyślnie zaznaczaj „Uwzględnij w raporcie aktywności”'}
            hint="Dotyczy nowych działań. Agent może odznaczyć pole przy konkretnym wpisie."
          />
        </Fieldset>
      </div>

      <Fieldset title="Kojarzenie ofert z poszukiwaniami">
        <p className="text-sm text-slate-600">
          Ile poza zakresem klienta oferta może jeszcze wyjść, żeby trafić do sekcji
          „prawie pasuje”. Klienci często oglądają mieszkania trochę droższe albo
          trochę mniejsze, niż wpisali.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <RangePair label="Cena" minusName="match_price_minus" plusName="match_price_plus"
            minus={options.match_price_minus} plus={options.match_price_plus} />
          <RangePair label="Powierzchnia" minusName="match_area_minus" plusName="match_area_plus"
            minus={options.match_area_minus} plus={options.match_area_plus} />
        </div>
      </Fieldset>
    </ResultForm>
  );
}

function Check({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-emerald-500" />
      <span>
        <span className="block text-sm text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

function RangePair({
  label,
  minusName,
  plusName,
  minus,
  plus,
}: {
  label: string;
  minusName: string;
  plusName: string;
  minus: number;
  plus: number;
}) {
  const box = `${inputCls} w-20 text-center tabular-nums`;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span aria-hidden="true">−</span>
        <input name={minusName} type="number" min={0} max={100} defaultValue={minus} className={box} aria-label={`${label}: poniżej zakresu`} />
        <span>%</span>
        <span className="px-1" aria-hidden="true">+</span>
        <input name={plusName} type="number" min={0} max={100} defaultValue={plus} className={box} aria-label={`${label}: powyżej zakresu`} />
        <span>%</span>
      </div>
    </div>
  );
}
