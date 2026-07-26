import {
  getSeller,
  amountToWordsPL,
  formatMoney,
  invoiceTotal,
  VAT_NOTE,
  type InvoiceItem,
} from "@/lib/invoice";

export type SheetData = {
  number: string;
  sellerKey: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostcode: string;
  buyerNip: string;
  buyerPesel: string;
  place: string;
  issueDate: string;
  saleDate: string;
  paymentDate: string;
  paymentMethod: string;
  items: InvoiceItem[];
  description: string;
  paid: number;
  issuer: string;
};

function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Logo Spectra" width={56} height={56} className="rounded-full" />;
}

export function InvoiceSheet({ data }: { data: SheetData }) {
  const seller = getSeller(data.sellerKey);
  const total = invoiceTotal(data.items);

  return (
    <div className="invoice-sheet mx-auto w-full max-w-[820px] bg-white p-8 text-[13px] leading-relaxed text-zinc-900 shadow-xl md:p-10">
      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-sm font-semibold text-zinc-900">Agencja Nieruchomości Spectra</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">FAKTURA</h1>
          <p className="text-sm font-medium text-zinc-700">Nr {data.number || "—"}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {data.place || "Kraków"}, {data.issueDate || "—"}
          </p>
        </div>
      </div>

      {/* Sprzedawca / Nabywca */}
      <div className="grid grid-cols-2 gap-8 py-6">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Sprzedawca
          </p>
          <p className="font-semibold">{seller.name}</p>
          <p>{seller.address}</p>
          <p>
            {seller.postcode} {seller.city}
          </p>
          <p className="mt-1">NIP: {seller.nip}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {seller.bank} · {seller.account}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Nabywca
          </p>
          <p className="font-semibold">{data.buyerName || "—"}</p>
          {data.buyerAddress && <p>{data.buyerAddress}</p>}
          {(data.buyerPostcode || data.buyerCity) && (
            <p>
              {data.buyerPostcode} {data.buyerCity}
            </p>
          )}
          {data.buyerNip && <p className="mt-1">NIP: {data.buyerNip}</p>}
          {data.buyerPesel && <p className="mt-1">PESEL: {data.buyerPesel}</p>}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 border-y border-zinc-200 py-3 text-xs sm:grid-cols-4">
        <Meta label="Forma płatności" value={data.paymentMethod || "Przelew"} />
        <Meta label="Termin płatności" value={data.paymentDate || "—"} />
        <Meta label="Data sprzedaży" value={data.saleDate || "—"} />
        <Meta label="Data wystawienia" value={data.issueDate || "—"} />
      </div>

      {/* Pozycje */}
      <table className="mt-5 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-zinc-300 text-left text-zinc-600">
            <th className="py-2 pr-2 font-medium">Lp.</th>
            <th className="py-2 pr-2 font-medium">Nazwa towaru / usługi</th>
            <th className="py-2 pr-2 text-right font-medium">Ilość</th>
            <th className="py-2 pr-2 text-right font-medium">Cena netto</th>
            <th className="py-2 pr-2 text-right font-medium">VAT</th>
            <th className="py-2 text-right font-medium">Wartość brutto</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => {
            const val = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
            return (
              <tr key={i} className="border-b border-zinc-100 align-top">
                <td className="py-2 pr-2">{i + 1}</td>
                <td className="py-2 pr-2">{it.name || "—"}</td>
                <td className="py-2 pr-2 text-right">{it.qty || 0}</td>
                <td className="py-2 pr-2 text-right">{formatMoney(Number(it.unitPrice) || 0)} zł</td>
                <td className="py-2 pr-2 text-right">zw</td>
                <td className="py-2 text-right">{formatMoney(val)} zł</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Podsumowanie */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Razem netto</span>
            <span>{formatMoney(total)} zł</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>VAT (zw)</span>
            <span>0,00 zł</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-zinc-300 pt-2 text-base font-bold text-zinc-900">
            <span>Do zapłaty</span>
            <span>{formatMoney(total)} zł</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Zapłacono</span>
            <span>{formatMoney(data.paid || 0)} zł</span>
          </div>
          <div className="flex justify-between font-semibold text-zinc-900">
            <span>Pozostało do zapłaty</span>
            <span>{formatMoney(Math.max(0, total - (data.paid || 0)))} zł</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-700">
        <span className="text-zinc-500">Słownie: </span>
        {amountToWordsPL(total)}
      </p>

      {/* Uwagi */}
      <div className="mt-5 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
        <p>{VAT_NOTE}</p>
        {data.description && <p className="mt-1">{data.description}</p>}
      </div>

      {/* Podpisy */}
      <div className="mt-10 grid grid-cols-2 gap-8 text-center text-[11px] text-zinc-500">
        <div>
          <div className="mx-auto mb-1 w-4/5 border-t border-zinc-300" />
          Podpis osoby uprawnionej do odbioru faktury
        </div>
        <div>
          {data.issuer && <p className="mb-1 font-medium text-zinc-800">{data.issuer}</p>}
          <div className="mx-auto mb-1 w-4/5 border-t border-zinc-300" />
          Podpis osoby upoważnionej do wystawienia faktury
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">{label}</p>
      <p className="font-medium text-zinc-900">{value}</p>
    </div>
  );
}
