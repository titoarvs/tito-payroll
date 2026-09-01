import type { EmployeeSortBy } from "~/api-services/employees.types";
import type { TableColumnDef } from "~/components/ui/table-column-visibility";

export type EmployeeTableColumnId =
  | "employeeCode"
  | "department"
  | "position"
  | "status"
  | "startDate"
  | "createdAt";

export type EmployeeTableColumnDef = TableColumnDef<EmployeeTableColumnId> & {
  sortKey?: EmployeeSortBy;
};

export const EMPLOYEE_TABLE_COLUMN_DEFS: EmployeeTableColumnDef[] = [
  { id: "employeeCode", label: "Employee ID" },
  { id: "department", label: "Department", sortKey: "department" },
  { id: "position", label: "Position", sortKey: "position" },
  { id: "status", label: "Status", sortKey: "status" },
  { id: "startDate", label: "Hire date", sortKey: "start_date" },
  { id: "createdAt", label: "Created" },
];

export const EMPLOYEE_TABLE_COLUMNS_STORAGE_KEY =
  "payroll.employees.tableColumns.v1";

export const columnDefById = (
  id: EmployeeTableColumnId,
): EmployeeTableColumnDef =>
  EMPLOYEE_TABLE_COLUMN_DEFS.find((col) => col.id === id)!;
