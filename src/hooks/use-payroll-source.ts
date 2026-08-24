import { useMutation, useQuery } from "@tanstack/react-query";
import { payrollSourceService } from "~/api-services/payroll-source.service";
import type {
  HolidaysListParams,
  LeaveRequestsListParams,
} from "~/api-services/payroll-source.types";
import {
  getHolidaysForPayrollQuery,
  getLeaveRequestsForPayrollQuery,
} from "~/queries/payroll-source";

export const useLeaveRequestsForPayroll = (
  params: LeaveRequestsListParams = {},
  enabled = true,
) => useQuery({ ...getLeaveRequestsForPayrollQuery(params), enabled });

export const useHolidaysForPayroll = (
  params: HolidaysListParams = {},
  enabled = true,
) => useQuery({ ...getHolidaysForPayrollQuery(params), enabled });

/** Audited reveal — call only when a pay-run actor needs Basic Pay inputs. */
export const useRevealEmployeeCompensation = () =>
  useMutation({
    mutationFn: (input: { employeeId: string; reason: string }) =>
      payrollSourceService.revealCompensation(input.employeeId, input.reason),
  });
