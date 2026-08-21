import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services";
import type { InviteUserInput, UpdateProfileInput, UserListParams } from "@/services/user.service";
import type { AccountStatus, Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

const MOCK_CLIENT_IP = "203.0.113.10";

export function useUsersList(params: UserListParams = { pageSize: 50 }) {
  return useQuery({
    queryKey: [...queryKeys.userList, params],
    queryFn: () => services.users.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userDetail(id ?? ""),
    queryFn: () => services.users.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) => services.users.invite(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userList });
    },
  });
}

export function useOrganization() {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => services.users.getCurrentOrganization(),
  });
}

export function useUpdateOrganizationName() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (name: string) => services.users.updateOrganizationName(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.organization });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "PROFILE_UPDATED",
          resourceType: "organization",
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "medium",
        });
      }
    },
  });
}

async function invalidateUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.userList }),
  ]);
}

export function useUpdateUserRole(userId: string) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  return useMutation({
    mutationFn: (role: Role) => services.users.updateRole(userId, role),
    onSuccess: async () => {
      await invalidateUser(queryClient, userId);
      if (user?.id === userId) await refreshUser();
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "ROLE_CHANGED",
          resourceType: "user",
          resourceId: userId,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "high",
        });
      }
    },
  });
}

export function useUpdateUserStatus(userId: string) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  return useMutation({
    mutationFn: (status: AccountStatus) => services.users.updateStatus(userId, status),
    onSuccess: async () => {
      await invalidateUser(queryClient, userId);
      if (user?.id === userId) await refreshUser();
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "USER_STATUS_CHANGED",
          resourceType: "user",
          resourceId: userId,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "high",
        });
      }
    },
  });
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => services.users.updateProfile(userId, input),
    onSuccess: async () => {
      await invalidateUser(queryClient, userId);
      if (user?.id === userId) await refreshUser();
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "PROFILE_UPDATED",
          resourceType: "user",
          resourceId: userId,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}

export function useSetMfaEnabled(userId: string) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  return useMutation({
    mutationFn: (enabled: boolean) => services.users.setMfaEnabled(userId, enabled),
    onSuccess: async () => {
      await invalidateUser(queryClient, userId);
      if (user?.id === userId) await refreshUser();
    },
  });
}

export function useChangePassword() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      services.auth.changePassword(input),
    onSuccess: async (result) => {
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "PASSWORD_CHANGED",
          resourceType: "user",
          resourceId: user.id,
          ipAddress: MOCK_CLIENT_IP,
          result: result.success ? "success" : "failure",
          severity: "medium",
        });
      }
    },
  });
}
