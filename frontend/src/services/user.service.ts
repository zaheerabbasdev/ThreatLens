import type { AccountStatus, Organization, PageRequest, PaginatedResult, Role, User } from "@/types";

export interface UserListParams extends PageRequest {
  role?: Role;
  status?: AccountStatus;
}

export interface UpdateProfileInput {
  name: string;
  title?: string;
}

export interface InviteUserInput {
  name: string;
  email: string;
  role: Exclude<Role, "super_admin">;
}

export interface UserService {
  list(params?: UserListParams): Promise<PaginatedResult<User>>;
  getById(id: string): Promise<User | null>;
  getCurrentOrganization(): Promise<Organization>;
  updateOrganizationName(name: string): Promise<Organization>;
  updateRole(id: string, role: Role): Promise<User>;
  updateStatus(id: string, status: AccountStatus): Promise<User>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<User>;
  setMfaEnabled(id: string, enabled: boolean): Promise<User>;
  invite(input: InviteUserInput): Promise<User>;
}
