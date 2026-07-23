// Mini-mapka na bazie darmowego embeda OpenStreetMap (iframe, bez paczek npm,
// bez klucza API). Pokazuje marker w podanym punkcie.

export function MiniMap({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title?: string;
}) {
  const d = 0.006; // rozmiar wycinka mapy wokół markera
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const fullUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <iframe
        src={src}
        title={title ?? "Mapa lokalizacji"}
        loading="lazy"
        className="h-56 w-full border-0"
      />
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-xs text-zinc-400 transition hover:text-emerald-400"
      >
        Otwórz większą mapę ↗
      </a>
    </div>
  );
}
