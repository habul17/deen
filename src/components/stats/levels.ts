/**
 * One-ink sequential steps for "prayers kept in a day", 1 through 5. Level 0 is drawn as an outline.
 * Mixed from the current ink so they read on any sky.
 */
export const LEVEL_BG = [
  "transparent",
  "color-mix(in srgb, var(--ink) 14%, transparent)",
  "color-mix(in srgb, var(--ink) 26%, transparent)",
  "color-mix(in srgb, var(--ink) 40%, transparent)",
  "color-mix(in srgb, var(--ink) 64%, transparent)",
  "var(--ink)",
];

/** Levels dark enough that their number needs the button ink. */
export const LEVEL_INVERTS = (level: number) => level >= 4;
