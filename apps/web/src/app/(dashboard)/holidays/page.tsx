"use client";

import { useHolidays } from "@/hooks/use-holidays";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { polishName } from "./holidays-translations";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const COLUMNS = ["Data", "Dzień tygodnia", "Nazwa święta"] as const;
const COLUMN_WIDTHS = ["w-[30%]", "w-[30%]", "w-[40%]"];

export default function HolidaysPage() {
  const [search, setSearch] = useState("");

  // Zastąpiono manualne useQuery gotowym hookiem useHolidays
  const { data: holidays, isLoading, isError } = useHolidays();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getWeekday = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
      })
        .format(date)
        .toLowerCase();
    } catch {
      return "";
    }
  };

  const enrichedHolidays = useMemo(() => {
    if (!holidays) return [];
    return holidays.map((holiday) => ({
      ...holiday,
      formattedDate: formatDate(holiday.date),
      weekday: getWeekday(holiday.date),
      translatedName: polishName(holiday.name),
    }));
  }, [holidays]);

  const fuse = useMemo(() => {
    return new Fuse(enrichedHolidays, {
      keys: ["date", "formattedDate", "weekday", "translatedName"],
      threshold: 0.3,
    });
  }, [enrichedHolidays]);

  const filteredHolidays = useMemo(() => {
    if (!search.trim()) return enrichedHolidays;
    return fuse.search(search).map((result) => result.item);
  }, [search, fuse, enrichedHolidays]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Ładowanie dni wolnych...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        Błąd podczas ładowania dni wolnych
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex max-w-full shrink-0 items-center gap-3 border-b border-border bg-card px-6 py-4">
        <div className="relative flex-1 grow">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Szukaj świąt..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 pr-4 pl-9"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
        <Card className="flex h-full flex-col overflow-hidden border border-border p-0 shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((label, index) => (
                    <TableHead key={label} className={COLUMN_WIDTHS[index]}>
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-12 text-sm text-muted-foreground"
                    >
                      Brak świąt pasujących do kryteriów wyszukiwania
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHolidays.map((holiday, index) => (
                    <TableRow
                      key={holiday.date}
                      className={
                        index % 2 === 1 ? "bg-table-row-alt" : undefined
                      }
                    >
                      <TableCell className="font-medium text-foreground">
                        {holiday.formattedDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {holiday.weekday}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {holiday.translatedName}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
