/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";

export type MapPoint = {
  id: string;
  title: string;
  price: number | null;
  lat: number;
  lng: number;
  kind?: string; // "sprzedaz" | "wynajem"
};

/** Krótka, czytelna cena na pinezce. */
function shortPrice(n: number | null, kind?: string): string {
  if (n == null) return "cena?";
  if (kind === "wynajem") return new Intl.NumberFormat("pl-PL").format(n) + " zł/mc";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return (Number.isInteger(m) ? String(m) : m.toFixed(1).replace(".", ",")) + " mln";
  }
  if (n >= 1000) return Math.round(n / 1000) + " tys.";
  return new Intl.NumberFormat("pl-PL").format(n) + " zł";
}

function pinHtml(label: string, color: string): string {
  return `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))">
    <div style="background:${color};color:#0a0a0a;font:700 12px/1 system-ui,-apple-system,sans-serif;padding:6px 9px;border-radius:9px;white-space:nowrap;border:1.5px solid rgba(255,255,255,.35)">${label}</div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${color};margin-top:-1px"></div>
  </div>`;
}

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      if (window.L) resolve(window.L);
      return;
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => resolve(window.L);
    document.body.appendChild(s);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

export function PropertiesMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView([50.0647, 19.945], 11);
      mapRef.current = map;
      // Ciemne kafelki (CARTO dark) - spójne z motywem aplikacji.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const markers: any[] = [];
      for (const p of points) {
        const color = p.kind === "wynajem" ? "#38bdf8" : "#34d399"; // sky / emerald
        const icon = L.divIcon({
          html: pinHtml(shortPrice(p.price, p.kind), color),
          className: "",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
        const full = p.price != null ? new Intl.NumberFormat("pl-PL").format(p.price) + " zł" : "-";
        m.bindPopup(
          `<div style="min-width:150px"><strong>${escapeHtml(p.title)}</strong><br>` +
            `<span style="color:#a1a1aa">${p.kind === "wynajem" ? "Wynajem" : "Sprzedaż"} · ${full}${p.kind === "wynajem" ? "/mc" : ""}</span><br>` +
            `<a href="/app/nieruchomosci/${p.id}">Otwórz ofertę →</a></div>`,
        );
        markers.push(m);
      }
      if (markers.length) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.25));
      }
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points]);

  // `isolate` = własny kontekst warstw - trzyma wysokie z-index Leafletu wewnątrz,
  // żeby mapa nie przebijała okien modalnych (position:fixed).
  return <div ref={ref} className="isolate h-[380px] w-full" style={{ background: "#0e0e11" }} />;
}
