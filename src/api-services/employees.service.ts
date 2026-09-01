import { hrisApi } from "~/lib/hris-api-client";
import { toQueryString } from "./query-string";
import type {
  EmployeeDashboardParams,
  EmployeeDashboardResponse,
  EmployeeDetailResponse,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeMeResponse,
} from "./employees.types";

const PATH = "/employee201/employees";
const DASHBOARD_PATH = "/employee201/dashboard";

export const employeesService = {
  list: (params: EmployeeListParams = {}) =>
    hrisApi.get<EmployeeListResponse>(
      `${PATH}${toQueryString({ ...params })}`,
    ),
  getById: (id: string) =>
    hrisApi.get<EmployeeDetailResponse>(`${PATH}/${id}`),
  getMe: () => hrisApi.get<EmployeeMeResponse>(`${PATH}/me`),
  getDashboard: (params: EmployeeDashboardParams = {}) =>
    hrisApi.get<EmployeeDashboardResponse>(
      `${DASHBOARD_PATH}${toQueryString({ ...params })}`,
    ),
};
