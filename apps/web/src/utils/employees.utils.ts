import Fuse from "fuse.js";
import { Employee, EmployeesList } from "@/types";

export interface EnrichedEmployee extends Omit<Employee, "workSchedule"> {
  ok: boolean;
  workSchedule: { start: string; end: string };
  locationName: string;
  searchIndex: string;
}

export const COLUMNS = [
  "Imię",
  "Nazwisko",
  "Stanowisko",
  "Lokalizacja",
  "Status",
] as const;

export const getLocationName = (location: number): string =>
  location === 1 ? "Hala" : "Biuro";

export const enrichEmployees = (employees: EmployeesList): EnrichedEmployee[] =>
  employees.map((employee) => {
    const locationName = getLocationName(employee.location);
    const statusText = employee.ok ? "OK" : "Problem";

    const rawSchedule = employee.workSchedule as unknown as {
      start?: string;
      end?: string;
    };
    const workSchedule = {
      start: rawSchedule?.start ?? "",
      end: rawSchedule?.end ?? "",
    };

    return {
      ...(employee as unknown as EnrichedEmployee),
      workSchedule,
      locationName,
      searchIndex: `${employee.name} ${employee.surname} ${employee.position} ${locationName} ${statusText}`,
    };
  });

export const createEmployeeFuse = (enrichedEmployees: EnrichedEmployee[]) =>
  new Fuse(enrichedEmployees, {
    keys: ["searchIndex"],
    threshold: 0.35,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

export const performSearch = (
  fuse: Fuse<EnrichedEmployee>,
  searchQuery: string,
  enrichedEmployees: EnrichedEmployee[],
): EnrichedEmployee[] => {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return enrichedEmployees;

  const terms = trimmedQuery.split(/\s+/).filter(Boolean);
  const query = {
    $and: terms.map((term) => ({ searchIndex: term })),
  };

  return fuse.search(query).map((result) => result.item);
};
