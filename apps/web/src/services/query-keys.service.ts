export class QueryKeysService {
  private static readonly ATTENDANCE_SCOPE = "attendance" as const;
  private static readonly EMPLOYEE_SCOPE = "employee" as const;
  private static readonly ABSENCES_SCOPE = "absences" as const;

  public static attendancePerMonth(params: {
    employeeId: string;
    year: number;
    month: number;
  }) {
    return [
      this.ATTENDANCE_SCOPE,
      params.employeeId,
      "month",
      params.year,
      params.month,
    ] as const;
  }

  /** Wszystkie absencje pracownika w danym roku (np. lista nieobecności NN). */
  public static absencesPerYear(params: { employeeId: string; year: number }) {
    return [this.ABSENCES_SCOPE, params.employeeId, params.year] as const;
  }

  public static employeeDetails(params: { employeeId: string }) {
    return [this.EMPLOYEE_SCOPE, params.employeeId] as const;
  }

  public static employeesList() {
    return [this.EMPLOYEE_SCOPE, "list"] as const;
  }

  public static employeeLeave(params: { employeeId: string }) {
    return [this.EMPLOYEE_SCOPE, "leave", params.employeeId] as const;
  }
}
