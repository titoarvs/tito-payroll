import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { logoutFromHris } from "~/lib/hris-auth";
import { currentUserKeys, getCurrentUserQuery } from "~/queries/current-user";

export const useCurrentUser = () => useQuery(getCurrentUserQuery());

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => logoutFromHris(),
    onSettled: async () => {
      queryClient.removeQueries({ queryKey: currentUserKeys.all });
      await navigate({ to: "/sign-in" });
    },
  });
};
