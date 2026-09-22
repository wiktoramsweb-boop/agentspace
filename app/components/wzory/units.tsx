"use client";

import { useMemo, useState } from "react";
import { UNIT_STATUS_LABEL, type Unit } from "@/lib/wzory/units";

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

/**
 * Tabela mieszkań w inwestycji. Ceny są jawne z premedytacją: deweloperzy,
 * którzy je pokazują, dostają mniej telefonów, ale znacznie lepsze.
 */
export function UnitTable({ units }: { units: Unit[] }) {
  const [rooms, setRooms] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [onlyFree, setOnlyFree] = useState(true);
  const [sort, setSort] = useState<"cena" | "metraz" | "pietro">("cena");

  const rows = useMemo(() => {
    const out = units.filter(
      (u) =>
        (rooms == null || u.rooms === rooms) &&
        (floor == null || u.floor === floor) &&
        (!onlyFree || u.status === "wolne"),
    );
    const cmp = {
      cena: (a: Unit, b: Unit) => a.price - b.price,
      metraz: (a: Unit, b: Unit) => a.area - b.area,
      pietro: (a: Unit, b: Unit) => a.floor - b.floor,
    }[sort];
    return [...out].sort(cmp);
  }, [units, rooms, floor, onlyFree, sort]);

  const free = units.filter((u) => u.status === "wolne");
  const from = free.length ? Math.min(...free.map((u) => u.price)) : 0;
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);

  return (
    <div className="hor-units">
      <div className="hor-units__bar">
        <div className="hor-units__chips">
          <span className="hor-units__label">Pokoje</span>
          <button type="button" aria-pressed={rooms === null} onClick={() => setRooms(null)}>
            Wszystkie
          </button>
          {[1, 2, 3, 4].map((r) => (
            <button key={r} type="button" aria-pressed={rooms === r} onClick={() => setRooms(rooms === r ? null : r)}>
              {r}
            </button>
          ))}
        </div>

        <div className="hor-units__chips">
          <span className="hor-units__label">Piętro</span>
          <button type="button" aria-pressed={floor === null} onClick={() => setFloor(null)}>
            Wszystkie
          </button>
          {floors.map((f) => (
            <button key={f} type="button" aria-pressed={floor === f} onClick={() => setFloor(floor === f ? null : f)}>
              {f === 0 ? "P" : f}
            </button>
          ))}
        </div>

        <label className="hor-units__check">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
          Tylko wolne
        </label>

        <label className="hor-units__sort">
          Sortuj
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="cena">po cenie</option>
            <option value="metraz">po metrażu</option>
            <option value="pietro">po piętrze</option>
          </select>
        </label>
      </div>

      <p className="hor-units__count">
        {rows.length} {rows.length === 1 ? "mieszkanie" : rows.length < 5 ? "mieszkania" : "mieszkań"} na liście ·
        ceny od <b>{zl(from)}</b>
      </p>

      <div className="hor-units__scroll">
        <table>
          <thead>
            <tr>
              <th>Numer</th>
              <th>Piętro</th>
              <th>Pokoje</th>
              <th>Metraż</th>
              <th>Ekspozycja</th>
              <th>Dodatkowo</th>
              <th>Cena</th>
              <th>Za m²</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={u.status !== "wolne" ? "is-taken" : undefined}>
                <td>
                  <b>{u.id}</b>
                </td>
                <td>{u.floor === 0 ? "parter" : u.floor}</td>
                <td>{u.rooms}</td>
                <td>{u.area.toFixed(1).replace(".", ",")} m²</td>
                <td>{u.aspect}</td>
                <td>{u.extra}</td>
                <td>
                  <b>{zl(u.price)}</b>
                </td>
                <td>{zl(Math.round(u.price / u.area))}</td>
                <td>
                  <span className={`hor-badge hor-badge--${u.status}`}>{UNIT_STATUS_LABEL[u.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="hor-units__empty">
          Nic nie pasuje do tych filtrów. Zmień kryteria albo zapytaj o kolejny etap inwestycji.
        </p>
      )}
    </div>
  );
}
