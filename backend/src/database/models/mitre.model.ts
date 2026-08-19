import { Schema, model } from "mongoose";

export interface MitreTacticDoc {
  _id: string;
  name: string;
  shortName: string;
  description: string;
}

export interface MitreTechniqueDoc {
  _id: string;
  tacticIds: string[];
  name: string;
  description: string;
  isSubTechnique: boolean;
  parentTechniqueId?: string;
}

/** Global reference data (spec §44) — `_id` is the real ATT&CK ID (e.g. "TA0001", "T1566"), not a generated UUID; no organizationId, no timestamps (seeded once, not user-mutated). */
const mitreTacticSchema = new Schema<MitreTacticDoc>(
  { _id: String, name: { type: String, required: true }, shortName: { type: String, required: true }, description: { type: String, required: true } },
  { timestamps: false },
);

/** Indexes: `tacticIds` (the one documented filter — MitreTechniqueListParams.tacticId) and a text-ish name index for search via regex (small reference collection, no need for a real text index). */
const mitreTechniqueSchema = new Schema<MitreTechniqueDoc>(
  {
    _id: String,
    tacticIds: { type: [String], required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    isSubTechnique: { type: Boolean, required: true },
    parentTechniqueId: String,
  },
  { timestamps: false },
);
mitreTechniqueSchema.index({ tacticIds: 1 });

export const MitreTacticModel = model<MitreTacticDoc>("MitreTactic", mitreTacticSchema);
export const MitreTechniqueModel = model<MitreTechniqueDoc>("MitreTechnique", mitreTechniqueSchema);
