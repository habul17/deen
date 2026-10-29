"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, LocateFixed, MapPin, Search } from "lucide-react";
import { locateMe, searchPlaces, type Place } from "@/lib/location";

/** GPS in one tap, or search any city by name. */
export function LocationPicker({ onPick, autoFocus }: { onPick: (p: Place) => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(query, controller.signal));
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Search is unavailable right now. Check your connection.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const shown = query.trim().length < 2 ? [] : results;

  const gps = async () => {
    setLocating(true);
    setError(null);
    try {
      onPick(await locateMe());
    } catch (e) {
      const denied = (e as GeolocationPositionError)?.code === 1;
      setError(denied ? "Location access was declined. Search for your city instead." : "Couldn't get your location. Search for your city instead.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={gps}
        disabled={locating}
        className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:border-line-strong disabled:opacity-70"
      >
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">
          {locating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" strokeWidth={1.75} />}
        </span>
        <span>
          <span className="block text-[15px] font-medium">Use my current location</span>
          <span className="block text-[13px] text-muted">Most accurate prayer times</span>
        </span>
      </button>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" strokeWidth={1.75} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city"
          aria-label="Search for a city"
          autoFocus={autoFocus}
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-line bg-surface pr-10 pl-11 text-[15px] outline-none placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
        {searching && <LoaderCircle className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-faint" />}
      </div>

      {error && <p className="mt-3 px-1 text-[13px] text-missed">{error}</p>}

      <AnimatePresence initial={false}>
        {shown.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
          >
            {shown.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  onClick={() => onPick(r)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors hover:bg-surface-2"
                >
                  <MapPin className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
                  <span className="truncate">{r.name}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {query.trim().length >= 2 && !searching && results.length === 0 && !error && (
        <p className="mt-3 px-1 text-[13px] text-muted">No places found for “{query.trim()}”.</p>
      )}
    </div>
  );
}
