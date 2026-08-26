import { hrisApi } from "~/lib/hris-api-client";
import { toQueryString } from "./query-string";
import type {
  EmployeeCompensationRevealResponse,
  HolidaysListParams,
  HolidaysListResponse,
  LeaveRequestsListParams,
  LeaveRequestsListResponse,
} from "./payroll-source.types";

const EMPLOYEES_PATH = "/employee201/employees";
const LEAVE_PATH = "/employee201/leave-requests";
const HOLIDAYS_PATH = "/employee201/holidays";

/**
 * Payroll source-data clients (FR-PR inputs). Money stays string.
 * Consultant branch: employmentStatus === "consultant" → Hours × Rate, no deductions.
 */
export const payrollSourceService = {
  revealCompensation: (employeeId: string, reason: string) =>
    hrisApi.post<EmployeeCompensationRevealResponse>(
      `${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}/salary`,
      { reason },
    ),

  listLeaveRequests: (params: LeaveRequestsListParams = {}) =>
    hrisApi.get<LeaveRequestsListResponse>(
      `${LEAVE_PATH}${toQueryString({ ...params })}`,
    ),

  listHolidays: (params: HolidaysListParams = {}) =>
    hrisApi.get<HolidaysListResponse>(
      `${HOLIDAYS_PATH}${toQueryString({ ...params })}`,
    ),
};
