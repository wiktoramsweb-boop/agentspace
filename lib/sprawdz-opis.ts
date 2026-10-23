/** Sprawdzenie opisu z formatowaniem (`npm run test:opis`). */
import { czyHtml, oczyscHtml, opisDoZapisu, opisNaHtml, opisNaTekst } from "./opis-html.ts";

let bledy = 0;
const rowne = (opis: string, jest: string, ma: string) => {
  if (jest !== ma) {
    bledy++;
    console.error(`BŁĄD  ${opis}\n  jest: ${jest}\n  ma:   ${ma}`);
  }
};
rowne("skrypt wycięty", oczyscHtml('<p>Hej<script>alert(1)</script></p>'), "<p>Hej</p>");
rowne("atrybuty wycięte", oczyscHtml('<p onclick="x()" style="color:red">A <b class="y">B</b></p>'), "<p>A <strong>B</strong></p>");
rowne("i na em", oczyscHtml("<i>tak</i>"), "<em>tak</em>");
rowne("obcy znacznik bez treści", oczyscHtml('<p>Zobacz <a href="javascript:x">tu</a></p>'), "<p>Zobacz tu </p>");
rowne("img wycięty", oczyscHtml('<p>a<img src=x onerror=alert(1)>b</p>'), "<p>a b</p>");
rowne("iframe wycięty", oczyscHtml('<iframe src="x"></iframe><p>ok</p>'), "<p>ok</p>");
rowne("zwykły tekst na akapity", opisDoZapisu("Pierwszy\n\nDrugi\nlinia"), "<p>Pierwszy</p><p>Drugi<br>linia</p>");
rowne("znaki < > w tekście", opisDoZapisu("cena < 500 tys."), "<p>cena &lt; 500 tys.</p>");
rowne("HTML na tekst", opisNaTekst("<p><strong>Atuty</strong></p><ul><li>balkon</li><li>winda</li></ul>"), "Atuty\n• balkon\n• winda");
rowne("stary tekst bez zmian", opisNaTekst("zwykły\nopis"), "zwykły\nopis");
rowne("wyświetlanie starego tekstu", opisNaHtml("a\n\nb"), "<p>a</p><p>b</p>");
if (czyHtml("cena <500")) {
  bledy++;
  console.error("BŁĄD  „<500” to nie HTML");
}
if (bledy) {
  console.error(`\nOpis: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Opis z formatowaniem w porządku.");
