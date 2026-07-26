/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";

export type MapPoint = {
  id: string;
  title: string;
  price: number | null;
  lat: number;
  lng: number;
};

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
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const markers: any[] = [];
      for (const p of points) {
        const m = L.marker([p.lat, p.lng]).addTo(map);
        const price = p.price != null ? new Intl.NumberFormat("pl-PL").format(p.price) + " zł" : "—";
        m.bindPopup(
          `<strong>${escapeHtml(p.title)}</strong><br>${price}<br>` +
            `<a href="/app/nieruchomosci/${p.id}">Otwórz ofertę →</a>`,
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

  return <div ref={ref} className="h-[380px] w-full" style={{ background: "#0e0e11" }} />;
}
