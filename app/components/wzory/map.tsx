"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { shortPrice, type DemoOffer } from "@/lib/wzory/data";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

declare global {
  interface Window {
    L?: any;
  }
}

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

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/**
 * Mapa ofert dla wzoru. Pinezka pokazuje od razu cenę, bo to pierwsza rzecz,
 * której szuka kupujący, a dopiero potem zdjęcie.
 */
export function WzMap({ offers, base, dark = false }: { offers: DemoOffer[]; base: string; dark?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      if (!map.current) {
        map.current = L.map(box.current, { scrollWheelZoom: false, zoomControl: true }).setView([50.0614, 19.9366], 11);
        const tiles = dark
          ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        L.tileLayer(tiles, { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map.current);
      }
      if (layer.current) layer.current.remove();

      const markers = offers.map((o) => {
        const icon = L.divIcon({
          html: `<span class="wzpin">${esc(shortPrice(o))}</span>`,
          className: "",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        return L.marker([o.lat, o.lng], { icon }).bindPopup(
          `<div style="min-width:190px;font-family:system-ui,sans-serif">
            <img src="${o.photos[0]}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:6px;margin-bottom:7px">
            <strong style="display:block;margin-bottom:2px">${esc(o.title)}</strong>
            <span style="color:#64748b;font-size:12px">${esc(o.district)} · ${o.area} m²</span><br>
            <a href="${base}/oferta/${o.id}" style="color:#2563eb">Zobacz ofertę →</a>
          </div>`,
        );
      });

      layer.current = L.featureGroup(markers).addTo(map.current);
      if (markers.length) map.current.fitBounds(layer.current.getBounds().pad(0.3), { maxZoom: 14 });
      setTimeout(() => map.current?.invalidateSize(), 150);
    });

    return () => {
      cancelled = true;
    };
  }, [offers, base, dark]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return <div ref={box} style={{ width: "100%", height: "100%" }} aria-label="Mapa ofert" />;
}
