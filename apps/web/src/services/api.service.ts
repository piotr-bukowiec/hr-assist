import { UserProfile } from "@/store/useAuthStore";
import {
  Absences,
  CreateEmployeeDto,
  CompanyNameAndId,
  Employee,
  EmployeesList,
  Holiday,
  Leave,
  UpdateEmployeeDto,
} from "@/types";
import { apiRequest } from "./api-request";
import { UpdateEmployeeAttendanceDto } from "@/utils/calendar.types";
import { isValid, parseISO } from "date-fns";
import { ErrorResponse } from "@/types/response-wrapper.types";

export interface ReportFile {
  blob: Blob;
  fileName: string;
}

export class ApiService {
  static async login(email: string, password: string): Promise<UserProfile> {
    const data = await apiRequest<UserProfile>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipToastOnNetworkError: true,
    });
    return data;
  }

  static async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  }

  static async getEmployees(): Promise<EmployeesList> {
    const data = await apiRequest<EmployeesList>("/api/employees");
    return data;
  }

  static async getEmployee(id: string): Promise<Employee> {
    const data = await apiRequest<Employee>(`/api/employees/${id}`);
    return data;
  }

  static async getHolidays(): Promise<Holiday[]> {
    const data = await apiRequest<Holiday[]>("/api/holidays");
    return data;
  }

  static async getCompaniesNamesAndIds(): Promise<CompanyNameAndId[]> {
    const data = await apiRequest<CompanyNameAndId[]>("/api/companies");
    return data;
  }

  static async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<Employee> {
    const data = await apiRequest<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(createEmployeeDto),
    });
    return data;
  }

  static async getPositions(): Promise<string[]> {
    const data = await apiRequest<string[]>("/api/employees/positions");
    return data;
  }

  static async isPeselAvailable(pesel: string): Promise<boolean> {
    const data = await apiRequest<boolean>(
      `/api/employees/pesel/check-availability?pesel=${pesel}`,
    );
    return data;
  }

  static async getEmployeeById(id: string): Promise<Employee> {
    const data = await apiRequest<Employee>(`/api/employees/${id}`);
    return data;
  }

  static async getEmployeeAbsencesByMonth(
    id: string,
    year: number,
    month: number,
    signal?: AbortSignal,
  ): Promise<Absences> {
    const data = await apiRequest<Absences>(
      `/api/employees/${id}/attendance/absences?year=${year}&month=${month}`,
      { signal },
    );
    return data;
  }

  static async getEmployeeAbsencesByYear(
    id: string,
    year: number,
    signal?: AbortSignal,
  ): Promise<Absences> {
    const data = await apiRequest<Absences>(
      `/api/employees/${id}/attendance/absences?year=${year}`,
      { signal },
    );
    return data;
  }

  static async updateEmployeeAttendance(
    id: string,
    data: UpdateEmployeeAttendanceDto,
  ): Promise<void> {
    const response = await apiRequest<void>(`/api/employees/${id}/attendance`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response;
  }

  static async updateEmployee(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const data = await apiRequest<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
    return data;
  }

  static async getEmployeeLeave(id: string): Promise<Leave> {
    const data = await apiRequest<Leave>(`/api/employees/${id}/leaves`);
    return data;
  }

  static async canLeaveBeSet(id: string, newLeave: 20 | 26): Promise<boolean> {
    const data = await apiRequest<boolean>(
      `/api/employees/${id}/leaves/can-be-set?leave=${newLeave}`,
    );
    return data;
  }

  static async deleteEmployee(id: string): Promise<null> {
    const data = await apiRequest<null>(`/api/employees/${id}`, {
      method: "DELETE",
    });
    return data;
  }

  static async fireEmployee(id: string): Promise<Employee> {
    const data = await apiRequest<Employee>(`/api/employees/${id}/fire`, {
      method: "POST",
    });
    return data;
  }

  static async recoverEmployee(id: string): Promise<Employee> {
    const data = await apiRequest<Employee>(`/api/employees/${id}/recover`, {
      method: "POST",
    });
    return data;
  }

  static async hasLeavesBeforeGivenDate(
    id: string,
    date: string,
  ): Promise<boolean> {
    if (!date || !isValid(parseISO(date))) {
      throw new Error("Invalid date format");
    }

    const data = await apiRequest<boolean>(
      `/api/employees/${id}/leaves/has-leaves-before-given-date?date=${date}`,
    );
    return data;
  }

  static async countAbsencesAfter(
    employeeId: string,
    date: string,
  ): Promise<number> {
    const response = await apiRequest<number>(
      `/employees/${employeeId}/attendance/absences/count-after?date=${date}`,
    );
    return response;
  }

  /**
   * Monthly timesheet as an .xlsx file. Bypasses `apiRequest`, which always
   * parses JSON — on success the backend streams the raw file, and only errors
   * come wrapped in `ResponseWrapper`.
   */
  static async getEmployeeMonthlyReport(
    employeeId: string,
    year: number,
    month: number, // 1-12
  ): Promise<ReportFile> {
    const url = new URL(
      `/api/reports/${employeeId}/${year}/${month}`,
      process.env.NEXT_PUBLIC_API_URL!,
    );

    let response: Response;
    try {
      response = await fetch(url, { credentials: "include" });
    } catch {
      throw new Error(
        "Brak połączenia z serwerem (backend wyłączony lub zablokowany przez sieć).",
      );
    }

    if (!response.ok) {
      const body: ErrorResponse | null = await response
        .json()
        .catch(() => null);
      throw new Error(
        body?.errors?.join(", ") || "Nie udało się wygenerować raportu",
      );
    }

    // Backend sends: attachment; filename="<pesel>-<name>-<surname>-MM-YYYY.xlsx"
    const fileName =
      response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] ?? "raport.xlsx";

    return { blob: await response.blob(), fileName };
  }
}
