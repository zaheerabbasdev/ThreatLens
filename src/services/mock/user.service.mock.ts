import type { UpdateProfileInput, UserListParams, UserService } from "@/services/user.service";
import type { AccountStatus, Organization, PaginatedResult, Role, User } from "@/types";
import { MOCK_ORGANIZATION, MOCK_USERS } from "@/mocks/identity";
import { delay, paginate } from "./util";

function requireUser(id: string): User {
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error(`User ${id} not found.`);
  return user;
}

export class MockUserService implements UserService {
  async list(params?: UserListParams): Promise<PaginatedResult<User>> {
    let items = [...MOCK_USERS];
    if (params?.role) items = items.filter((u) => u.role === params.role);
    if (params?.status) items = items.filter((u) => u.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    // Cloned, not the live singleton references — see the note in
    // incident.service.mock.ts's list() for why this matters after a write.
    return delay(paginate(items.map((u) => ({ ...u })), params), 300);
  }

  async getById(id: string): Promise<User | null> {
    await delay(undefined, 250);
    const user = MOCK_USERS.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async getCurrentOrganization(): Promise<Organization> {
    return delay({ ...MOCK_ORGANIZATION }, 200);
  }

  async updateOrganizationName(name: string): Promise<Organization> {
    await delay(undefined, 400);
    MOCK_ORGANIZATION.name = name;
    return { ...MOCK_ORGANIZATION };
  }

  async updateRole(id: string, role: Role): Promise<User> {
    await delay(undefined, 400);
    const user = requireUser(id);
    user.role = role;
    return { ...user };
  }

  async updateStatus(id: string, status: AccountStatus): Promise<User> {
    await delay(undefined, 400);
    const user = requireUser(id);
    user.status = status;
    return { ...user };
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    await delay(undefined, 400);
    const user = requireUser(id);
    user.name = input.name;
    user.title = input.title;
    return { ...user };
  }

  async setMfaEnabled(id: string, enabled: boolean): Promise<User> {
    await delay(undefined, 300);
    const user = requireUser(id);
    user.mfaEnabled = enabled;
    return { ...user };
  }
}
