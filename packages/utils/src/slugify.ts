/**
 * Lower-cases a string and converts it into a URL-safe kebab slug.
 * Strips diacritics so "Botë" → "bote".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
