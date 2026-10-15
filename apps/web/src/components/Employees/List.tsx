"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiService } from "@/services/api.service";
import { QueryKeysService } from "@/services/query-keys.service";
import { MapPin, Users, AlertCircle, Loader2 } from "lucide-react";
import { EmployeesList } from "@/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  COLUMNS,
  enrichEmployees,
  createEmployeeFuse,
  performSearch,
} from "@/utils/employees.utils";
import ms from "ms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const COLUMN_WIDTHS = ["w-[16%]", "w-[16%]", "w-[28%]", "w-[20%]", "w-[20%]"];

export default function List() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const {
    data: employees = [],
    isLoading,
    isError,
  } = useQuery<EmployeesList>({
    queryKey: QueryKeysService.employeesList(),
    queryFn: async () =>
      (await ApiService.getEmployees()) as unknown as EmployeesList,
    staleTime: ms("5 minutes"),
    gcTime: ms("1 hour"),
    retry: 1,
  });

  const enrichedEmployees = useMemo(
    () => enrichEmployees(employees),
    [employees],
  );

  const fuse = useMemo(
    () => createEmployeeFuse(enrichedEmployees),
    [enrichedEmployees],
  );

  const filteredEmployees = useMemo(
    () => performSearch(fuse, searchQuery, enrichedEmployees),
    [searchQuery, fuse, enrichedEmployees],
  );

  if (isLoading && employees.length === 0) {
    return (
      <div className="min-h-0 flex-1 px-6 py-5">
        <Card className="flex h-full flex-col items-center justify-center p-12 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Ładowanie listy pracowników...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError && employees.length === 0) {
    return (
      <div className="min-h-0 flex-1 px-6 py-5">
        <Card className="flex h-full flex-col items-center justify-center border-destructive/35 bg-destructive/5 p-12 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <AlertCircle className="h-8 w-8 text-destructive mb-3" />
            <p className="text-sm font-semibold text-destructive">
              Nie udało się pobrać listy pracowników.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sprawdź połączenie z serwerem i spróbuj ponownie.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
      <Card className="flex h-full flex-col overflow-hidden border border-border p-0 shadow-sm">
        {/* Jak w kalendarzu: kontener Table nie może mieć własnego overflow,
            inaczej sticky nagłówek przykleja się do niego zamiast do tego scrolla */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none *:data-[slot=table-container]:overflow-visible">
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
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Brak wyników
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Brak pracowników spełniających kryteria wyszukiwania.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    className={`cursor-pointer ${
                      index % 2 === 1 ? "bg-table-row-alt" : ""
                    }`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {employee.name}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {employee.surname}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.position}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <MapPin data-icon="inline-start" />
                        {employee.locationName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!employee.ok ? (
                        <Badge variant="destructive">Do uzupełnienia</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
