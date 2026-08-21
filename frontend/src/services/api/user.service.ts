import type { InviteUserInput, UpdateProfileInput, UserListParams, UserService } from "@/services/user.service";
import type { AccountStatus, Organization, PaginatedResult, Role, User } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiUserService implements UserService {
  async list(params?: UserListParams): Promise<PaginatedResult<User>> {
    const { data, meta } = await requestWithMeta<User[]>("/users", {
      query: { page: params?.page, pageSize: params?.pageSize, role: params?.role, status: params?.status, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<User | null> {
    return apiRequestOrNull<User>(`/users/${id}`);
  }

  getCurrentOrganization(): Promise<Organization> {
    return apiRequest<Organization>("/organization");
  }

  updateOrganizationName(name: string): Promise<Organization> {
    return apiRequest<Organization>("/organization", { method: "PATCH", body: { name } });
  }

  updateRole(id: string, role: Role): Promise<User> {
    return apiRequest<User>(`/users/${id}/role`, { method: "PATCH", body: { role } });
  }

  updateStatus(id: string, status: AccountStatus): Promise<User> {
    return apiRequest<User>(`/users/${id}/status`, { method: "PATCH", body: { status } });
  }

  updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    return apiRequest<User>(`/users/${id}/profile`, { method: "PATCH", body: input });
  }

  setMfaEnabled(id: string, enabled: boolean): Promise<User> {
    return apiRequest<User>(`/users/${id}/mfa`, { method: "PATCH", body: { enabled } });
  }

  invite(input: InviteUserInput): Promise<User> {
    return apiRequest<User>("/users/invite", { method: "POST", body: input });
  }
}
