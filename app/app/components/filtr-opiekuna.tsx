"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "./select";

/** Filtr opiekuna nad tablicą: całe biuro, moje albo konkretna osoba. */
export function FiltrOpiekuna({ ludzie, wartosc }: { ludzie: { id: string; name: string }[]; wartosc: string }) {
  const router = useRouter();
  const sciezka = usePathname();
  const params = useSearchParams();
  function ustaw(v: string) {
    const p = new URLSearchParams(params.toString());
    if (v) p.set("agent", v);
    else p.delete("agent");
    router.push(`${sciezka}?${p.toString()}`);
  }
  return (
    <div className="w-56">
      <Select
        aria-label="Opiekun"
        value={wartosc}
        onChange={(e) => ustaw(e.target.value)}
        options={[
          { value: "", label: "Całe biuro" },
          { value: "ja", label: "Tylko moje" },
          ...ludzie.map((l) => ({ value: l.id, label: l.name })),
        ]}
        placeholder=""
      />
    </div>
  );
}
