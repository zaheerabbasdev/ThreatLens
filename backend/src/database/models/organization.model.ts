import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";

export interface OrganizationDoc {
  _id: string;
  name: string;
  slug: string;
  plan: "starter" | "team" | "enterprise";
  createdAt: Date;
}

/** Same `_id`-as-string rationale as user.model.ts. No index beyond the default `_id` one — every lookup here is by ID (spec §11: index actual query patterns, not every field). */
const organizationSchema = new Schema<OrganizationDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, maxlength: 120 },
    plan: { type: String, required: true, enum: ["starter", "team", "enterprise"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const OrganizationModel = model<OrganizationDoc>("Organization", organizationSchema);
