// Test ścieżki Teoria: npm run test:teoria
import { strict as assert } from "node:assert";
import { MODULY_TEORII, TESTY, WSZYSTKIE_PYTANIA_TEORII, WSZYSTKIE_ROZDZIALY_TEORII, losujPytania, maTeorie, nowaListaBledow, ocenTeorie } from "./techniki/teoria.ts";

const ids = WSZYSTKIE_PYTANIA_TEORII.map((q) => q.id);
assert.equal(new Set(ids).size, ids.length, "powtórzone id pytań");
assert.equal(new Set(WSZYSTKIE_ROZDZIALY_TEORII.map((r) => r.id)).size, WSZYSTKIE_ROZDZIALY_TEORII.length, "powtórzone id rozdziałów");

for (const m of MODULY_TEORII) {
  assert.ok(m.pytania.length >= TESTY[m.id].ile, `${m.id}: za mało pytań na test`);
  for (const q of m.pytania) {
    assert.ok(q.id.startsWith(m.id + "-"), `${q.id}: zły przedrostek`);
    assert.ok(m.rozdzialy.some((r) => r.id === q.rozdzial), `${q.id}: rozdział ${q.rozdzial} nie istnieje w module`);
    assert.equal(q.odpowiedzi.length, 4, `${q.id}: ma mieć 4 odpowiedzi`);
    assert.ok(q.poprawna >= 0 && q.poprawna < 4, `${q.id}: zły numer poprawnej`);
    assert.equal(new Set(q.odpowiedzi).size, 4, `${q.id}: powtórzona odpowiedź`);
    // Dobra odpowiedź nie może zdradzać się długością.
    const dobra = q.odpowiedzi[q.poprawna].length;
    const najdluzszaZla = Math.max(...q.odpowiedzi.filter((_, i) => i !== q.poprawna).map((x) => x.length));
    assert.ok(dobra <= najdluzszaZla * 1.15, `${q.id}: poprawna odpowiedź wyraźnie najdłuższa (${dobra} > ${najdluzszaZla})`);
    assert.ok(!/—/.test(q.pytanie + q.odpowiedzi.join("") + q.wyjasnienie), `${q.id}: długi myślnik`);
  }
}
for (const r of WSZYSTKIE_ROZDZIALY_TEORII) assert.ok(!JSON.stringify(r.bloki).includes("—"), `${r.id}: długi myślnik`);

// Poprawna odpowiedź nie może stać ciągle na tej samej pozycji (tasowanie jest i tak, ale baza ma być zrównoważona).
const pozycje = [0, 1, 2, 3].map((i) => WSZYSTKIE_PYTANIA_TEORII.filter((q) => q.poprawna === i).length);
assert.ok(Math.max(...pozycje) < WSZYSTKIE_PYTANIA_TEORII.length * 0.7, "poprawne prawie zawsze na jednej pozycji");

let ziarno = 1;
const los = () => ((ziarno = (ziarno * 16807) % 2147483647) - 1) / 2147483646;
assert.equal(losujPytania("m1", los).length, TESTY.m1.ile);
const egz = losujPytania("egzamin", los);
assert.equal(egz.length, TESTY.egzamin.ile);
assert.equal(new Set(egz.map((q) => q.id)).size, egz.length, "egzamin bez powtórzeń");
assert.deepEqual(losujPytania("bledy", los, ["m2-03"]).map((q) => q.id), ["m2-03"]);
assert.equal(losujPytania("bledy", los, []).length, 0);

const q = WSZYSTKIE_PYTANIA_TEORII[0];
const o = ocenTeorie([{ id: q.id, wybrana: q.poprawna }, { id: "m2-01", wybrana: -1 }, { id: "nie-ma", wybrana: 0 }]);
assert.deepEqual([o.wynik, o.max, o.bledne], [1, 2, ["m2-01"]]);
assert.deepEqual(nowaListaBledow(["m1-01", "m3-02"], ["m2-01"], ["m1-01"]), ["m3-02", "m2-01"]);

assert.equal(maTeorie("fe78fb77-98e3-4e3e-831b-067c2fc4cc9e"), true);
assert.equal(maTeorie("inne-biuro"), false);
assert.equal(maTeorie(null), false);

console.log(`Teoria OK: ${MODULY_TEORII.length} moduły, ${WSZYSTKIE_ROZDZIALY_TEORII.length} rozdziałów, ${WSZYSTKIE_PYTANIA_TEORII.length} pytań (poprawne na pozycjach: ${pozycje.join("/")}).`);
