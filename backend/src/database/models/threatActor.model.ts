import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";

export interface ThreatActorDoc {
  _id: string;
  name: string;
  aliases: string[];
  description: string;
  motivations: string[];
  techniqueIds: string[];
  firstObserved?: Date;
}

/** Global reference data (spec §41) — same reasoning as mitre.model.ts. */
const threatActorSchema = new Schema<ThreatActorDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true },
    aliases: { type: [String], default: [] },
    description: { type: String, required: true },
    motivations: { type: [String], default: [] },
    techniqueIds: { type: [String], default: [] },
    firstObserved: Date,
  },
  { timestamps: false },
);

export const ThreatActorModel = model<ThreatActorDoc>("ThreatActor", threatActorSchema);
