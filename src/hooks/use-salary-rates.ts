import { useQuery } from "@tanstack/react-query";
import {
  getEmployeeSalaryRatesQuery,
} from "~/queries/salary-rates";

export const useEmployeeSalaryRates = (
  employeeId: string,
  options?: { enabled?: boolean },
) => useQuery(getEmployeeSalaryRatesQuery(employeeId, options));
