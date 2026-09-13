import { useQuery } from "@tanstack/react-query";
import type {
  EmployeeDashboardParams,
  EmployeeListParams,
} from "~/api-services/employees.types";
import {
  getEmployeeDashboardQuery,
  getEmployeeQuery,
  getEmployeesQuery,
  getMyEmployeeQuery,
} from "~/queries/employees";

export const useEmployees = (params: EmployeeListParams = {}) =>
  useQuery(getEmployeesQuery(params));

export const useEmployee = (id: string) => useQuery(getEmployeeQuery(id));

export const useMyEmployee = (enabled = true) =>
  useQuery({ ...getMyEmployeeQuery(), enabled });

export const useEmployeeDashboard = (
  params: EmployeeDashboardParams = {},
  enabled = true,
) => useQuery({ ...getEmployeeDashboardQuery(params), enabled });
