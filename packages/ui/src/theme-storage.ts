import { getColorTheme, type ColorThemeId } from "./color-themes";

export const COLOR_THEME_STORAGE_KEY = "nivra-classic-color-theme";

export function readStoredColorTheme(): ColorThemeId {
  if (typeof window === "undefined") return "classic";
  try {
    const raw = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (!raw) return "classic";
    return getColorTheme(raw as ColorThemeId).id;
  } catch {
    return "classic";
  }
}

export function writeStoredColorTheme(id: ColorThemeId) {
  try {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}
