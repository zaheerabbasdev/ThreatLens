import { OrganizationModel } from "../database/models/organization.model.js";
import type { OrganizationDoc } from "../database/models/organization.model.js";
import type { OrganizationRepository } from "./organization.repository.js";
import type { Organization } from "../types/organization.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */
function toDomain(doc: OrganizationDoc): Organization {
  return { id: doc._id, name: doc.name, slug: doc.slug, plan: doc.plan, createdAt: doc.createdAt.toISOString() };
}

export class MongoOrganizationRepository implements OrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findById(id).lean<OrganizationDoc>();
    return doc ? toDomain(doc) : null;
  }

  async create(org: Organization): Promise<Organization> {
    // AuthService.register already chose the ID (it's the caller's own
    // organizationId, generated before this call) — passed through as
    // `_id` rather than letting the schema default generate a new one.
    const doc = await OrganizationModel.create({ _id: org.id, name: org.name, slug: org.slug, plan: org.plan });
    return toDomain(doc.toObject());
  }

  async update(id: string, patch: Partial<Omit<Organization, "id">>): Promise<Organization | null> {
    const doc = await OrganizationModel.findByIdAndUpdate(id, patch, { new: true }).lean<OrganizationDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryOrganizationRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(org: Organization): Promise<void> {
    await OrganizationModel.findByIdAndUpdate(org.id, { _id: org.id, ...org }, { upsert: true, setDefaultsOnInsert: true });
  }
}
