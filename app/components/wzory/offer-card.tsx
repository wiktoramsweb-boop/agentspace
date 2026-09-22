import Link from "next/link";
import Image from "next/image";
import { DEAL_LABELS, KIND_LABELS, priceLabel, pricePerM2, offerSummary, type DemoOffer } from "@/lib/wzory/data";
import { FavButton } from "./favorites";

/** Karta oferty. Wygląd zmienia motyw, treść jest zawsze ta sama. */
export function OfferCard({
  offer,
  wzor,
  priority = false,
  sizes = "(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: {
  offer: DemoOffer;
  wzor: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <article className="wzc">
      <Link href={`/wzory/${wzor}/oferta/${offer.id}`} className="wzc__media">
        <Image src={offer.photos[0]} alt={offer.title} fill sizes={sizes} priority={priority} />
        <span className="wzc__tags">
          <span className="wzc__tag">{DEAL_LABELS[offer.deal]}</span>
          {offer.fresh && <span className="wzc__tag wzc__tag--accent">Nowość</span>}
        </span>
      </Link>
      <FavButton wzor={wzor} id={offer.id} label={offer.title} />

      <div className="wzc__body">
        <p className="wzc__loc">
          {offer.city} · {offer.district}
        </p>
        <h3 className="wzc__title">
          <Link href={`/wzory/${wzor}/oferta/${offer.id}`}>{offer.title}</Link>
        </h3>
        <p className="wzc__params">
          <span>{KIND_LABELS[offer.kind]}</span>
          {offerSummary(offer).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </p>
        <div className="wzc__foot">
          <span className="wzc__price">{priceLabel(offer)}</span>
          <span className="wzc__m2">{pricePerM2(offer)}</span>
        </div>
      </div>
    </article>
  );
}
