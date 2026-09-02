import { hrisApi } from "~/lib/hris-api-client";
import type { PayrollSalaryRatesResponse } from "./salary-rates.types";

const pathFor = (employeeId: string) =>
  `/payroll/employees/${encodeURIComponent(employeeId)}/salary-rates`;

export const salaryRatesService = {
  listForEmployee: (employeeId: string) =>
    hrisApi.get<PayrollSalaryRatesResponse>(pathFor(employeeId)),
};
