import { queryOptions } from "@tanstack/react-query";
import { getCurrentHrisUser } from "~/lib/hris-auth";

export const currentUserKeys = {
  all: ["current-user"] as const,
  me: () => [...currentUserKeys.all, "me"] as const,
};

export const getCurrentUserQuery = () =>
  queryOptions({
    queryKey: currentUserKeys.me(),
    queryFn: () => getCurrentHrisUser(),
  });
