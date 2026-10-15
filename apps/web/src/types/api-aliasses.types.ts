import { paths } from "./api.types";

export type Employee =
  paths["/api/employees/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type EmployeesList =
  paths["/api/employees"]["get"]["responses"]["200"]["content"]["application/json"];

export type Holiday =
  paths["/api/holidays/{year}"]["get"]["responses"]["200"]["content"]["application/json"][number];

export type CreateEmployeeDto = Omit<
  paths["/api/employees"]["post"]["requestBody"]["content"]["application/json"],
  "location"
> & {
  location: Location;
};

export enum Location {
  PRODUCTION = 1,
  OFFICE = 2,
}

export enum ContractType {
  EMPLOYMENT_CONTRACT = 1,
}

export type UpdateEmployeeDto =
  paths["/api/employees/{id}"]["put"]["requestBody"]["content"]["application/json"] &
    Partial<CreateEmployeeDto>;

export type Company =
  paths["/api/companies"]["get"]["responses"]["200"]["content"]["application/json"][number];

export type CompanyNameAndId = Pick<Company, "id" | "name">;

export type Position =
  paths["/api/employees/positions"]["get"]["responses"]["200"]["content"]["application/json"][number];

export type Absences =
  paths["/api/employees/{employeeId}/attendance/absences"]["get"]["responses"]["200"]["content"]["application/json"];

export type Absence = Absences[number];

export type Leave =
  paths["/api/employees/{employeeId}/leaves"]["get"]["responses"]["200"]["content"]["application/json"];
