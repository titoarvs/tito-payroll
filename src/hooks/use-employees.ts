import { useQuery } from "@tanstack/react-query";
import type { EmployeeListParams } from "~/api-services/employees.types";
import {
  getEmployeeQuery,
  getEmployeesQuery,
  getMyEmployeeQuery,
} from "~/queries/employees";

export const useEmployees = (params: EmployeeListParams = {}) =>
  useQuery(getEmployeesQuery(params));

export const useEmployee = (id: string) => useQuery(getEmployeeQuery(id));

export const useMyEmployee = (enabled = true) =>
  useQuery({ ...getMyEmployeeQuery(), enabled });
