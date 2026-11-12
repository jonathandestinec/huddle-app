export const RESERVED_SLUGS = new Set([
  "dashboard",
  "me",
  "api",
  "login",
  "logout",
  "admin",
  "settings",
  "pricing",
  "about",
  "help",
  "_next",
  "static",
  "huddle",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export function isReservedSlug(s: string): boolean {
  return RESERVED_SLUGS.has(s);
}
