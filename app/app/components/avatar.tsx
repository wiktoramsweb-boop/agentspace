import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";

const GRADIENTS = [
  "from-emerald-400 to-cyan-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-emerald-500",
];

/** Kolor tła inicjałów: stały dla danej osoby, żeby nie skakał przy odświeżeniu. */
function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function avatarUrl(path: string | null | undefined): string | null {
  return path ? publicAssetUrl(ASSET_BUCKET, path) : null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Zdjęcie agenta, a gdy go nie ma - inicjały na kolorowym tle. */
export function Avatar({
  name,
  path,
  url,
  size = 40,
  className = "",
  ring = false,
}: {
  name: string;
  path?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const src = url ?? avatarUrl(path);
  const box = `${ring ? "ring-2 ring-white " : ""}${className}`;
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={`flex-shrink-0 rounded-full object-cover ${box}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={style}
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${gradientFor(name || "?")} ${box}`}
    >
      {initials(name || "?")}
    </span>
  );
}
