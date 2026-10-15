"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionErrorBlock } from "@/components/ui/section-error-block";
import { ApiService } from "@/services/api.service";
import { QueryKeysService } from "@/services/query-keys.service";
import { EmployeeHeader } from "./EmployeeHeader";
import { EmployeeInfoTab } from "./EmployeeInfoTab";
import { EmployeeLeaveTab } from "./EmployeeLeaveTab";
import { ReportModal } from "./ReportModal";
import { EmployeeCalendar } from "../Calendar/EmployeeCalendar";
import { EmployeeModal } from "@/components/EmployeeModal/Modal/Modal";
import { ConfirmModal } from "@/components/ConfirmModal/ConfirmModal";
import { Employee, EmployeesList } from "@/types";

type EmployeeTab = "dane" | "urlopy";

export function EmployeeProfilePage() {
  const { id: employeeId } = useParams();

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<EmployeeTab>("dane");
  const tabsContentRef = useRef<HTMLDivElement>(null);
  const [tabsContentHeight, setTabsContentHeight] = useState<number>();
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isFireModalOpen, setIsFireModalOpen] = useState<boolean>(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleDeleteEmployee = async () => {
    // Guard against multiple clicks while the request is in flight.
    if (isDeleting) return;
    const id = employeeId as string;

    setIsDeleting(true);
    try {
      await ApiService.deleteEmployee(id);

      // Drop the employee from the cached list right away, then refetch it.
      // The profile query is left alone — removing it here would make the
      // still-mounted profile refetch the deleted employee before the redirect.
      queryClient.setQueryData<EmployeesList>(
        QueryKeysService.employeesList(),
        (list) => list?.filter((employee) => employee.id !== id),
      );
      void queryClient.invalidateQueries({
        queryKey: QueryKeysService.employeesList(),
      });

      toast.success("Pracownik został usunięty");
      setIsDeleteModalOpen(false);
      router.replace("/employees");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Nie udało się usunąć pracownika",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Zwolnienie (po potwierdzeniu) i przywrócenie — backend zwraca pracownika
  // z aktualnym `firedAt`, więc od razu wpisujemy go do cache profilu.
  const fireMutation = useMutation({
    mutationFn: (action: "fire" | "recover") => {
      const id = employeeId as string;
      return action === "fire"
        ? ApiService.fireEmployee(id)
        : ApiService.recoverEmployee(id);
    },
    onSuccess: (updated, action) => {
      const id = employeeId as string;
      queryClient.setQueryData<Employee>(
        QueryKeysService.employeeDetails({ employeeId: id }),
        (previous) =>
          previous && {
            ...previous,
            firedAt:
              action === "fire"
                ? (updated?.firedAt ?? new Date().toISOString())
                : null,
          },
      );
      void queryClient.invalidateQueries({
        queryKey: QueryKeysService.employeeDetails({ employeeId: id }),
      });
      void queryClient.invalidateQueries({
        queryKey: QueryKeysService.employeesList(),
      });

      toast.success(
        action === "fire"
          ? "Pracownik został zwolniony"
          : "Pracownik został przywrócony",
      );
      setIsFireModalOpen(false);
    },
    onError: (error, action) => {
      toast.error(
        error.message ||
          (action === "fire"
            ? "Nie udało się zwolnić pracownika"
            : "Nie udało się przywrócić pracownika"),
      );
    },
  });

  useLayoutEffect(() => {
    const node = tabsContentRef.current;
    if (!node) return;
    setTabsContentHeight(node.scrollHeight);
  }, [activeTab, currentPage]);

  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QueryKeysService.employeeDetails({
      employeeId: employeeId as string,
    }),
    queryFn: async () => await ApiService.getEmployeeById(employeeId as string),
    enabled: !!employeeId,
  });

  // Pobieranie danych o urlopach z uwzględnieniem struktury QueryKeysService
  const { data: leaveData } = useQuery({
    queryKey: QueryKeysService.employeeLeave({
      employeeId: employeeId as string,
    }),
    queryFn: async () =>
      await ApiService.getEmployeeLeave(employeeId as string),
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="flex h-100 w-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex h-full min-h-0 flex-col p-6">
        <SectionErrorBlock
          title="Błąd danych pracownika"
          description={
            error?.message || "Nie udało się pobrać szczegółów profilu."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isFired = Boolean(employee.firedAt);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-6 py-4">
      {/* 1. Odnośnik powrotny */}
      <div className="shrink-0">
        <Link
          href="/employees"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Powrót do listy pracowników
        </Link>
      </div>

      {/* 2. Nagłówek nawigacyjny i akcje */}
      <EmployeeHeader
        name={employee.name}
        surname={employee.surname}
        isFired={isFired}
        isFireActionPending={fireMutation.isPending}
        onReport={() => setIsReportOpen(true)}
        onEdit={() => {
          if (!isFired) setIsEditOpen(true);
        }}
        onFire={() => setIsFireModalOpen(true)}
        onRecover={() => fireMutation.mutate("recover")}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* 3. Główna karta */}
      <Card size="sm" className="flex shrink-0 flex-col gap-2 px-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EmployeeTab)}
          className="w-full gap-2"
        >
          <TabsList className="mx-auto grid w-64 grid-cols-2">
            <TabsTrigger value="dane">Dane pracownika</TabsTrigger>
            <TabsTrigger value="urlopy">Urlopy</TabsTrigger>
          </TabsList>

          <div
            style={{ height: tabsContentHeight }}
            className="overflow-hidden transition-[height] duration-200 ease-in-out"
          >
            <div ref={tabsContentRef} className="py-1.5">
              <EmployeeInfoTab
                employee={employee}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
              <EmployeeLeaveTab leaveData={leaveData} />
            </div>
          </div>
        </Tabs>
      </Card>

      <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardContent className="min-h-0 flex-1 overflow-hidden">
          <EmployeeCalendar
            employeeId={employeeId as string}
            schedule={{
              start: employee.workSchedule.start,
              end: employee.workSchedule.end,
              workHours: employee.workHours,
            }}
            employmentDate={employee.employmentDate}
            firedAt={employee.firedAt}
          />
        </CardContent>
      </Card>

      {/* Edycja na danych z cache `employeeDetails` — bez dodatkowego zapytania */}
      <EmployeeModal
        mode="edit"
        employee={employee}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <ReportModal
        employeeId={employeeId as string}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        employmentDate={employee.employmentDate}
        firedAt={employee.firedAt}
      />

      <ConfirmModal
        isOpen={isFireModalOpen}
        onClose={() => setIsFireModalOpen(false)}
        onConfirm={() => fireMutation.mutate("fire")}
        title="Zwalnianie pracownika"
        message="Czy na pewno chcesz zwolnić tego pracownika?"
        confirmText="Zwolnij"
        cancelText="Anuluj"
        variant="danger"
        isLoading={fireMutation.isPending}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEmployee}
        title="Usuwanie pracownika"
        message="Czy na pewno chcesz usunąć tego pracownika? Tej akcji nie można cofnąć."
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
