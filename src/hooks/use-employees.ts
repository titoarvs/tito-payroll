import { useQuery } from "@tanstack/react-query";
import type { EmployeeListParams } from "~/api-services/employees.types";
import { getEmployeeQuery, getEmployeesQuery } from "~/queries/employees";

export const useEmployees = (params: EmployeeListParams = {}) =>
  useQuery(getEmployeesQuery(params));

export const useEmployee = (id: string) => useQuery(getEmployeeQuery(id));
