"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ContractType, Employee } from "@/types";
import { getLocationName } from "@/utils/employees.utils";
import {
  formatEmploymentDate,
  formatSeniority,
  formatWorkSchedule,
  formatWorkTimeFraction,
} from "@/utils/employee-profile.utils";

/** 2 columns × 3 rows. */
export const EMPLOYEE_INFO_ITEMS_PER_PAGE = 6;

const NO_DATA = "Brak danych";

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.EMPLOYMENT_CONTRACT]: "UOP",
};

interface EmployeeDetailItem {
  title: string;
  content: ReactNode;
}

/**
 * Profile details in display order — reorder, add or remove entries here;
 * pagination follows the array (6 per page).
 */
const buildEmployeeDetails = (employee: Employee): EmployeeDetailItem[] => {
  const companyName = employee.company?.name || NO_DATA;

  return [
    // Page 1
    { title: "Stanowisko", content: employee.position },
    { title: "Lokalizacja", content: getLocationName(employee.location) },
    { title: "PESEL", content: employee.pesel },
    {
      title: "Godziny pracy",
      content: formatWorkSchedule(
        employee.workSchedule.start,
        employee.workSchedule.end,
        employee.workHours,
      ),
    },
    {
      title: "Wymiar etatu",
      content: formatWorkTimeFraction(employee.workHours),
    },
    {
      title: "Rodzaj umowy",
      content:
        CONTRACT_TYPE_LABELS[employee.contractType as ContractType] ?? NO_DATA,
    },
    // Page 2
    {
      title: "Data zatrudnienia",
      content: formatEmploymentDate(employee.employmentDate),
    },
    { title: "Staż pracy", content: formatSeniority(employee.employmentDate) },
    {
      title: "Firma",
      // `select-all` — one click selects the full name for copying; the tooltip
      // shows it in full when the card truncates it.
      content: (
        <span title={companyName} className="select-all">
          {companyName}
        </span>
      ),
    },
  ];
};

interface EmployeeInfoTabProps {
  employee: Employee;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function EmployeeInfoTab({
  employee,
  currentPage,
  onPageChange,
}: EmployeeInfoTabProps) {
  const detailsList = buildEmployeeDetails(employee);

  const totalPages = Math.ceil(detailsList.length / EMPLOYEE_INFO_ITEMS_PER_PAGE);
  const currentItems = detailsList.slice(
    currentPage * EMPLOYEE_INFO_ITEMS_PER_PAGE,
    (currentPage + 1) * EMPLOYEE_INFO_ITEMS_PER_PAGE,
  );

  const paddedItems = [
    ...currentItems,
    ...Array.from(
      { length: EMPLOYEE_INFO_ITEMS_PER_PAGE - currentItems.length },
      () => null,
    ),
  ];

  return (
    <TabsContent value="dane" className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
        disabled={currentPage === 0}
        className="shrink-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="grid flex-1 shrink-0 grid-cols-2 gap-3">
        {paddedItems.map((item, idx) => (
          <div key={item?.title ?? `empty-${idx}`}>
            {item ? (
              <Card className="flex flex-col space-y-1 bg-muted/40 p-3.5">
                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {item.title}
                </span>
                <span className="truncate text-sm font-semibold text-foreground">
                  {item.content}
                </span>
              </Card>
            ) : (
              <Card className="flex flex-col space-y-1 p-3.5 opacity-0">
                <span className="text-xs uppercase">placeholder</span>
                <span className="text-sm">placeholder</span>
              </Card>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
        disabled={currentPage >= totalPages - 1}
        className="shrink-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </TabsContent>
  );
}
