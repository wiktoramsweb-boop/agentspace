"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { loadLeaflet } from "../nieruchomosci/properties-map";
import type { Porownanie } from "@/lib/rcn-wycena";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Mapa z ulicami i budynkami: każda transakcja to pinezka z ceną za m². */
export function MapaPorownan({ lat, lng, porownania, cenaM2 }: { lat: number; lng: number; porownania: Porownanie[]; cenaM2: number }) {
  const pudelko = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: any = null;
    let koniec = false;
    loadLeaflet().then((L) => {
      if (koniec || !pudelko.current) return;
      mapa = L.map(pudelko.current, { scrollWheelZoom: false, zoomControl: true });
      // OpenStreetMap: bez klucza, z obrysami budynków od zoomu 15. CARTO wymaga klucza.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapa);
      const kolor = (v: number) => (v > cenaM2 * 1.08 ? "#e11d48" : v < cenaM2 * 0.92 ? "#0284c7" : "#059669");
      const punkty: [number, number][] = [[lat, lng]];
      const metrNaLng = 111_320 * Math.cos((lat * Math.PI) / 180);
      for (const p of porownania) {
        const q: [number, number] = [lat + p.dy / 111_320, lng + p.dx / metrNaLng];
        punkty.push(q);
        const etykieta = `${(p.cenaM2 / 1000).toFixed(1).replace(".", ",")} tys.`;
        const ikona = L.divIcon({
          className: "",
          iconSize: [0, 0],
          html: `<div style="width:max-content;transform:translate(-50%,-50%);background:${kolor(p.cenaM2)};color:#fff;font:700 11px/1 system-ui,sans-serif;padding:4px 6px;border-radius:7px;white-space:nowrap;border:1.5px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.35)">${etykieta}</div>`,
        });
        L.marker(q, { icon: ikona })
          .addTo(mapa)
          .bindPopup(`<b>${esc(p.adres)}</b><br>${p.cena.toLocaleString("pl-PL")} zł · ${p.pow.toLocaleString("pl-PL")} m²<br>${p.cenaM2.toLocaleString("pl-PL")} zł/m² · ${esc(p.data)}`);
      }
      const srodek = L.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div style="width:max-content;transform:translate(-50%,-100%);background:#0f172a;color:#fff;font:700 12px/1 system-ui,sans-serif;padding:6px 9px;border-radius:9px;white-space:nowrap;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.45)">To mieszkanie</div>`,
      });
      L.marker([lat, lng], { icon: srodek, zIndexOffset: 1000 }).addTo(mapa);
      mapa.fitBounds(L.latLngBounds(punkty), { padding: [40, 40], maxZoom: 16 });
    });
    return () => {
      koniec = true;
      mapa?.remove();
    };
  }, [lat, lng, porownania, cenaM2]);
  return <div ref={pudelko} className="isolate h-[460px] w-full overflow-hidden rounded-2xl" role="img" aria-label="Mapa porównywanych transakcji" />;
}
