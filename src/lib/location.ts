import { deviceTimeZone } from "./date";

/** Free, keyless lookups: Open-Meteo for city search, BigDataCloud for naming a GPS fix. */

export type Place = {
  latitude: number;
  longitude: number;
  name: string;
  countryCode: string | null;
  timezone: string;
};

const round = (n: number) => Math.round(n * 10_000) / 10_000;

export function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 });
  });
}

export async function locateMe(): Promise<Place> {
  const pos = await currentPosition();
  const latitude = round(pos.coords.latitude);
  const longitude = round(pos.coords.longitude);
  let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  let countryCode: string | null = null;
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (res.ok) {
      const d = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string; countryName?: string; countryCode?: string };
      const place = d.city || d.locality || d.principalSubdivision;
      if (place) name = [place, d.countryName].filter(Boolean).join(", ");
      countryCode = d.countryCode || null;
    }
  } catch {}
  return { latitude, longitude, name, countryCode, timezone: deviceTimeZone() };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`,
    { signal },
  );
  if (!res.ok) return [];
  const d = (await res.json()) as {
    results?: { name: string; latitude: number; longitude: number; country_code?: string; country?: string; admin1?: string; timezone?: string }[];
  };
  return (d.results ?? []).map((r) => ({
    latitude: round(r.latitude),
    longitude: round(r.longitude),
    name: [r.name, r.admin1 && r.admin1 !== r.name ? r.admin1 : null, r.country].filter(Boolean).join(", "),
    countryCode: r.country_code ?? null,
    timezone: r.timezone || deviceTimeZone(),
  }));
}
