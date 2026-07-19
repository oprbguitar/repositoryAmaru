export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9\s._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearch(value: string): string[] {
  return [
    ...new Set(
      normalizeSearch(value)
        .split(" ")
        .filter((token) => token.length > 1),
    ),
  ];
}
