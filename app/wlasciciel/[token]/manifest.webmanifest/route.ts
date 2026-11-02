import { brandingBiura } from "@/lib/data-portal";
import { dostepWlasciciela } from "@/lib/data-wlasciciel";

/** Aplikacja nazywa się jak biuro, które zarządza lokalem. Nazwa AgentSpace nie pada. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) return new Response("Nie znaleziono", { status: 404 });
  const biuro = await brandingBiura(d.agency_id);
  const baza = `/wlasciciel/${token}`;
  const krotka = biuro.nazwa.length <= 12 ? biuro.nazwa : biuro.nazwa.split(/\s+/).reduce((a, s) => (`${a} ${s}`.length <= 12 ? `${a} ${s}` : a), biuro.nazwa.split(/\s+/)[0].slice(0, 12));
  return Response.json(
    {
      name: biuro.nazwa,
      short_name: krotka,
      description: `Twoje mieszkanie w zarządzaniu ${biuro.nazwa}.`,
      lang: "pl",
      start_url: baza,
      scope: baza,
      id: baza,
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        { src: `${baza}/ikona?r=192`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `${baza}/ikona?r=512`, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: `${baza}/ikona?r=512&m=1`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json; charset=utf-8" } },
  );
}
