import { queryOptions } from "@tanstack/react-query";
import { salaryRatesService } from "~/api-services/salary-rates.service";

export const salaryRatesKeys = {
  all: ["salary-rates"] as const,
  byEmployee: (employeeId: string) =>
    [...salaryRatesKeys.all, "employee", employeeId] as const,
};

export const getEmployeeSalaryRatesQuery = (
  employeeId: string,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: salaryRatesKeys.byEmployee(employeeId),
    queryFn: () => salaryRatesService.listForEmployee(employeeId),
    enabled: (options?.enabled ?? true) && Boolean(employeeId),
  });
