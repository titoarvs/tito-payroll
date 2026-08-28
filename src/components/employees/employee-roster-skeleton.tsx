import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

export const EMPLOYEE_ROSTER_TABLE_BODY_CLASS =
  "max-h-[calc(100vh-11.5rem)] overflow-auto md:max-h-[calc(100vh-11.5rem)]";

interface EmployeeTableSkeletonProps {
  rowCount?: number;
  className?: string;
}

export const EmployeeTableSkeleton = ({
  rowCount = 10,
  className,
}: EmployeeTableSkeletonProps) => (
  <Card
    className={cn("flex flex-col overflow-hidden", className)}
    aria-busy="true"
    aria-label="Loading employee roster"
  >
    <CardContent className="flex flex-col p-0">
      <div className={EMPLOYEE_ROSTER_TABLE_BODY_CLASS}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[12rem]">Employee</TableHead>
              <TableHead className="min-w-[8rem]">Employee ID</TableHead>
              <TableHead className="min-w-[8rem]">Department</TableHead>
              <TableHead className="min-w-[8rem]">Position</TableHead>
              <TableHead className="min-w-[6rem]">Status</TableHead>
              <TableHead className="min-w-[6rem]">Hire date</TableHead>
              <TableHead className="min-w-[6rem]">Created</TableHead>
              <TableHead className="w-28 min-w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }, (_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-16 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-36" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-[4.5rem] rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface EmployeeCardGridSkeletonProps {
  count?: number;
  className?: string;
}

export const EmployeeCardGridSkeleton = ({
  count = 6,
  className,
}: EmployeeCardGridSkeletonProps) => (
  <ul
    className={cn(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className,
    )}
    aria-busy="true"
    aria-label="Loading employee roster"
  >
    {Array.from({ length: count }, (_, index) => (
      <li key={index}>
        <div className="tito-widget rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-2 border-t border-border/60 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </li>
    ))}
  </ul>
);
