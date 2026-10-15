/**
 * Test liczenia kosztów biura i kosztorysu remontu: `npm run test:koszty`.
 * Pieniądze i miesiące psują się po cichu (grudzień → styczeń, stawka „zw."),
 * więc sprawdzamy dokładnie te miejsca.
 */
import assert from "node:assert/strict";
import { brutto, netto, zakresMiesiaca, przesunMiesiac, doWygenerowania, poleCsv, csv } from "./koszty-model.ts";
import { nowyKosztorys, policz, stawkiVat } from "./remont.ts";

let n = 0;
const t = (nazwa, fn) => { try { fn(); n++; } catch (e) { console.error("✗", nazwa); throw e; } };

t("brutto 23%", () => assert.equal(brutto(100, "23"), 123));
t("brutto zw. = netto", () => assert.equal(brutto(100, "zw"), 100));
t("netto z brutto 8%", () => assert.equal(netto(108, 8), 100));
t("zakres grudnia kończy się w styczniu", () => assert.deepEqual(zakresMiesiaca("2026-12"), { od: "2026-12-01", doWyl: "2027-01-01" }));
t("przesunięcie przez rok", () => {
  assert.equal(przesunMiesiac("2026-01", -1), "2025-12");
  assert.equal(przesunMiesiac("2026-12", 1), "2027-01");
  assert.equal(przesunMiesiac("2026-10", -12), "2025-10");
});
t("stały koszt: przed dniem płatności nie generujemy", () =>
  assert.equal(doWygenerowania({ active: true, day_of_month: 20, last_generated_month: "2026-09" }, "2026-10-15"), false));
t("stały koszt: po dniu płatności generujemy", () =>
  assert.equal(doWygenerowania({ active: true, day_of_month: 10, last_generated_month: "2026-09" }, "2026-10-15"), true));
t("stały koszt: drugi raz w miesiącu nie", () =>
  assert.equal(doWygenerowania({ active: true, day_of_month: 10, last_generated_month: "2026-10" }, "2026-10-25"), false));
t("stały koszt wyłączony nie", () =>
  assert.equal(doWygenerowania({ active: false, day_of_month: 1, last_generated_month: null }, "2026-10-25"), false));
t("CSV: średnik i cudzysłów w polu", () => assert.equal(poleCsv('Firma; "X"'), '"Firma; ""X"""'));
t("CSV: kwota z przecinkiem", () => assert.equal(poleCsv(1234.5), "1234,50"));
t("CSV: BOM na początku", () => assert.equal(csv(["a"], [["b"]]).charCodeAt(0), 0xfeff));

t("remont: VAT 8% do 150 m², materiały od ekipy", () => assert.deepEqual(stawkiVat({ materialy: "wykonawca" }, 60), { r: 0.08, m: 0.08 }));
t("remont: materiały właściciela 23%", () => assert.deepEqual(stawkiVat({ materialy: "inwestor" }, 60), { r: 0.08, m: 0.23 }));
t("remont: powyżej 150 m² wszędzie 23%", () => assert.deepEqual(stawkiVat({ materialy: "wykonawca" }, 160), { r: 0.23, m: 0.23 }));
t("remont: brutto = netto + VAT + rezerwa", () => {
  const w = policz(nowyKosztorys(50, 2));
  const bez = w.netto + w.vatRobocizna + w.vatMaterialy;
  assert.ok(Math.abs(w.brutto - (bez + w.rezerwa)) < 0.02);
  assert.ok(Math.abs(w.rezerwa - bez * 0.1) < 0.02);
});
t("remont: generalny droższy od średniego, średni od odświeżenia", () => {
  const k = nowyKosztorys(50, 2);
  const o = policz({ ...k, zakres: "odswiezenie" }).brutto;
  const s = policz({ ...k, zakres: "sredni" }).brutto;
  const g = policz({ ...k, zakres: "generalny" }).brutto;
  assert.ok(o < s && s < g);
});
t("remont: ręczne wyłączenie pozycji obniża koszt", () => {
  const k = nowyKosztorys(50, 2);
  const przed = policz(k).brutto;
  const p0 = k.pomieszczenia[0];
  const po = policz({ ...k, pomieszczenia: [{ ...p0, wybor: { panele: false } }, ...k.pomieszczenia.slice(1)] }).brutto;
  assert.ok(po < przed);
});
t("remont: własna cena nie jest mnożona przez standard", () => {
  const k = { ...nowyKosztorys(50, 2), standard: "premium", ceny: { malowanie: { r: 10, m: 0 } } };
  const w = policz(k).wiersze.find((x) => x.pozId === "malowanie");
  assert.equal(w.cenaR, 10);
});

console.log(`✓ ${n} testów kosztów i remontu`);
