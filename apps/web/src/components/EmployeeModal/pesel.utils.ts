import { isValid, parse } from "date-fns";

const MONTH_CENTURY_OFFSETS: Array<{ base: number; offset: number }> = [
  { base: 1800, offset: 80 },
  { base: 1900, offset: 0 },
  { base: 2000, offset: 20 },
  { base: 2100, offset: 40 },
  { base: 2200, offset: 60 },
];

export const getBirthDateFromPesel = (pesel: string): Date | null => {
  if (!/^\d{11}$/.test(pesel)) return null;

  const year = parseInt(pesel.slice(0, 2), 10);
  const monthRaw = parseInt(pesel.slice(2, 4), 10);
  const day = parseInt(pesel.slice(4, 6), 10);

  const century = MONTH_CENTURY_OFFSETS.find(
    ({ offset }) => monthRaw > offset && monthRaw <= offset + 12,
  );
  if (!century) return null;

  const month = monthRaw - century.offset; // 1-12
  const fullYear = century.base + year;

  // Ścisłe parsowanie date-fns odrzuca nieistniejące daty (np. 31 lutego)
  // i przyjmuje miesiąc 1-12 — bez ręcznego przeliczania na indeks `Date`.
  const date = parse(`${fullYear}-${month}-${day}`, "yyyy-M-d", new Date());

  return isValid(date) ? date : null;
};
