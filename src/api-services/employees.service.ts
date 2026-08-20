import { hrisApi } from "~/lib/hris-api-client";
import { toQueryString } from "./query-string";
import type {
  EmployeeDetailResponse,
  EmployeeListParams,
  EmployeeListResponse,
} from "./employees.types";

const PATH = "/employee201/employees";

export const employeesService = {
  list: (params: EmployeeListParams = {}) =>
    hrisApi.get<EmployeeListResponse>(
      `${PATH}${toQueryString({ ...params })}`,
    ),
  getById: (id: string) =>
    hrisApi.get<EmployeeDetailResponse>(`${PATH}/${id}`),
};
