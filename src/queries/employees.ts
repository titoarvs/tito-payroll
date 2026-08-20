import { queryOptions } from "@tanstack/react-query";
import { employeesService } from "~/api-services/employees.service";
import type { EmployeeListParams } from "~/api-services/employees.types";

export const employeesKeys = {
  all: ["employees"] as const,
  list: (params: EmployeeListParams = {}) =>
    [...employeesKeys.all, "list", params] as const,
  detail: (id: string) => [...employeesKeys.all, "detail", id] as const,
  me: () => [...employeesKeys.all, "me"] as const,
};

export const getEmployeesQuery = (params: EmployeeListParams = {}) =>
  queryOptions({
    queryKey: employeesKeys.list(params),
    queryFn: () => employeesService.list(params),
  });

export const getEmployeeQuery = (id: string) =>
  queryOptions({
    queryKey: employeesKeys.detail(id),
    queryFn: () => employeesService.getById(id),
    enabled: Boolean(id),
  });

export const getMyEmployeeQuery = () =>
  queryOptions({
    queryKey: employeesKeys.me(),
    queryFn: () => employeesService.getMe(),
  });
