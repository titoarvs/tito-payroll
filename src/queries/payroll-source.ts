import { queryOptions } from "@tanstack/react-query";
import { payrollSourceService } from "~/api-services/payroll-source.service";
import type {
  HolidaysListParams,
  LeaveRequestsListParams,
} from "~/api-services/payroll-source.types";

export const payrollSourceKeys = {
  all: ["payroll-source"] as const,
  compensation: (employeeId: string) =>
    [...payrollSourceKeys.all, "compensation", employeeId] as const,
  leave: (params: LeaveRequestsListParams = {}) =>
    [...payrollSourceKeys.all, "leave", params] as const,
  holidays: (params: HolidaysListParams = {}) =>
    [...payrollSourceKeys.all, "holidays", params] as const,
};

export const getLeaveRequestsForPayrollQuery = (
  params: LeaveRequestsListParams = {},
) =>
  queryOptions({
    queryKey: payrollSourceKeys.leave(params),
    queryFn: () => payrollSourceService.listLeaveRequests(params),
  });

export const getHolidaysForPayrollQuery = (params: HolidaysListParams = {}) =>
  queryOptions({
    queryKey: payrollSourceKeys.holidays(params),
    queryFn: () => payrollSourceService.listHolidays(params),
  });
