"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import ms from "ms";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Pencil,
  UserX,
  Trash2,
  Printer,
  IdCard,
  Briefcase,
  MapPin,
  Building2,
  Timer,
  Clock,
  CalendarDays,
  FileText,
  CalendarRange,
  TriangleAlert,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api.service";
import { getLocationName } from "@/utils/employees.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmployeeDetailsProps {
  employeeId: string;
}

const notImplementedYet = () => toast("Funkcja w przygotowaniu");

const CONTRACT_TYPE_LABELS: Record<number, string> = {
  1: "Umowa o pracę",
};

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={13} />
        <p className="text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-wrap text-foreground">
        {value}
      </p>
    </div>
  );
}

export function EmployeeDetails({ employeeId }: EmployeeDetailsProps) {
  const router = useRouter();

  const {
    data: employee,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => await ApiService.getEmployee(employeeId),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => await ApiService.getEmployees(),
    staleTime: ms("5 minutes"),
    gcTime: ms("1 hour"),
  });

  const currentIndex = employees.findIndex((e) => e.id === employeeId);
  const previousEmployee = currentIndex > 0 ? employees[currentIndex - 1] : null;
  const nextEmployee =
    currentIndex >= 0 && currentIndex < employees.length - 1
      ? employees[currentIndex + 1]
      : null;

  const topBar = (
    <header className="flex max-w-full shrink-0 items-center gap-3 bg-card px-6 py-4">
      <Link
        href="/employees"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Powrót do listy
      </Link>
    </header>
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {topBar}
        <div className="min-h-0 flex-1 px-6 py-5">
          <Card className="flex h-full flex-col items-center justify-center p-12 text-center shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Ładowanie danych pracownika...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {topBar}
        <div className="min-h-0 flex-1 px-6 py-5">
          <Card className="flex h-full flex-col items-center justify-center border-destructive/35 bg-destructive/5 p-12 text-center shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                Nie udało się pobrać danych pracownika.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sprawdź połączenie z serwerem i spróbuj ponownie.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const employmentDate = format(new Date(employee.employmentDate), "dd.MM.yyyy");
  const workScheduleRange = `${employee.workSchedule.start.slice(0, 5)} - ${employee.workSchedule.end.slice(0, 5)}`;

  const mainDataBlocks = [
    { label: "PESEL", value: employee.pesel, icon: IdCard },
    { label: "Stanowisko", value: employee.position, icon: Briefcase },
    {
      label: "Lokalizacja",
      value: getLocationName(employee.location),
      icon: MapPin,
    },
    {
      label: "Firma",
      value: employee.company?.name || "Brak danych",
      icon: Building2,
    },
    { label: "Wymiar etatu", value: `${employee.workHours} h`, icon: Timer },
    { label: "Godziny pracy", value: workScheduleRange, icon: Clock },
    { label: "Data zatrudnienia", value: employmentDate, icon: CalendarDays },
    {
      label: "Typ umowy",
      value: CONTRACT_TYPE_LABELS[employee.contractType] ?? "—",
      icon: FileText,
    },
  ];

  const leaveDataBlocks = [
    {
      label: "Wymiar podstawowy",
      value: `${employee.leave.base} dni`,
      icon: CalendarRange,
    },
    {
      label: "Zaległy",
      value: `${employee.leave.overdue} dni`,
      icon: TriangleAlert,
    },
    {
      label: "Dostępny",
      value: `${employee.leave.current} dni`,
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {topBar}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <Card className="shadow-sm">
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Poprzedni pracownik"
                disabled={!previousEmployee}
                onClick={() =>
                  previousEmployee &&
                  router.push(`/employees/${previousEmployee.id}`)
                }
              >
                <ChevronLeft size={16} />
              </Button>

              <div className="flex flex-1 items-center justify-between gap-4">
                <h1 className="text-xl font-semibold text-foreground">
                  {employee.name} {employee.surname}
                </h1>

                <TooltipProvider>
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edytuj"
                            onClick={notImplementedYet}
                          />
                        }
                      >
                        <Pencil size={15} />
                      </TooltipTrigger>
                      <TooltipContent>Edytuj</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Zwolnij"
                            onClick={notImplementedYet}
                          />
                        }
                      >
                        <UserX size={15} />
                      </TooltipTrigger>
                      <TooltipContent>Zwolnij</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Usuń"
                            className="text-destructive hover:text-destructive"
                            onClick={notImplementedYet}
                          />
                        }
                      >
                        <Trash2 size={15} />
                      </TooltipTrigger>
                      <TooltipContent>Usuń</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Drukuj"
                            onClick={notImplementedYet}
                          />
                        }
                      >
                        <Printer size={15} />
                      </TooltipTrigger>
                      <TooltipContent>Drukuj</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Następny pracownik"
                disabled={!nextEmployee}
                onClick={() =>
                  nextEmployee && router.push(`/employees/${nextEmployee.id}`)
                }
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            <Tabs defaultValue="main">
              <TabsList>
                <TabsTrigger value="main">Dane główne</TabsTrigger>
                <TabsTrigger value="leave">Urlopy</TabsTrigger>
              </TabsList>

              <TabsContent value="main">
                <div className="grid grid-cols-4 gap-4">
                  {mainDataBlocks.map((block) => (
                    <InfoBlock key={block.label} {...block} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="leave">
                <div className="grid grid-cols-3 gap-4">
                  {leaveDataBlocks.map((block) => (
                    <InfoBlock key={block.label} {...block} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground">
              Kalendarz
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
