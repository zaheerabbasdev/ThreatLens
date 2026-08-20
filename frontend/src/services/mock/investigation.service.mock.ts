import type {
  AddInvestigationNoteInput,
  CreateInvestigationInput,
  InvestigationListParams,
  InvestigationService,
} from "@/services/investigation.service";
import type { Investigation, InvestigationNote, PaginatedResult, WorkflowStatus } from "@/types";
import { MOCK_INVESTIGATIONS } from "@/mocks/investigations";
import { MOCK_INCIDENTS } from "@/mocks/incidents";
import { MOCK_INDICATORS } from "@/mocks/indicators";
import { formatShortId } from "@/utils/format";
import { generateId } from "@/utils/id";
import { delay, paginate } from "./util";

function requireInvestigation(id: string): Investigation {
  const investigation = MOCK_INVESTIGATIONS.find((i) => i.id === id);
  if (!investigation) throw new Error(`Investigation ${id} not found.`);
  return investigation;
}

function pushTimelineEvent(
  investigation: Investigation,
  title: string,
  description: string,
  actor: string,
) {
  investigation.timeline = [
    ...investigation.timeline,
    { id: generateId("invtl"), timestamp: new Date().toISOString(), title, description, actor },
  ];
  investigation.updatedAt = new Date().toISOString();
}

export class MockInvestigationService implements InvestigationService {
  async list(params?: InvestigationListParams): Promise<PaginatedResult<Investigation>> {
    let items = [...MOCK_INVESTIGATIONS].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    if (params?.status) items = items.filter((i) => i.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }
    // Cloned, not the live singleton references — a real API would always
    // hand back fresh JSON, and returning the exact same object identity
    // here would let React Query's cache mistake "mutated in place" for
    // "unchanged" on the next refetch after a write.
    return delay(paginate(items.map((i) => ({ ...i })), params), 350);
  }

  async getById(id: string): Promise<Investigation | null> {
    await delay(undefined, 300);
    const investigation = MOCK_INVESTIGATIONS.find((i) => i.id === id);
    return investigation ? { ...investigation } : null;
  }

  async create(input: CreateInvestigationInput): Promise<Investigation> {
    await delay(undefined, 500);
    const now = new Date().toISOString();
    const investigation: Investigation = {
      id: generateId("inv"),
      title: input.title,
      description: input.description,
      leadAnalystId: input.leadAnalystId,
      status: "open",
      relatedIncidentIds: [],
      relatedIndicatorIds: [],
      notes: [],
      timeline: [
        {
          id: generateId("invtl"),
          timestamp: now,
          title: "Investigation opened",
          description: input.description || "Investigation opened.",
          actor: "You",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    MOCK_INVESTIGATIONS.unshift(investigation);
    return investigation;
  }

  async updateStatus(id: string, status: WorkflowStatus, actorName: string): Promise<Investigation> {
    await delay(undefined, 400);
    const investigation = requireInvestigation(id);
    investigation.status = status;
    pushTimelineEvent(investigation, "Status changed", `Marked ${status.replace("_", " ")}.`, actorName);
    return investigation;
  }

  async addNote(id: string, input: AddInvestigationNoteInput): Promise<InvestigationNote> {
    await delay(undefined, 400);
    const investigation = requireInvestigation(id);
    const note: InvestigationNote = {
      id: generateId("invnote"),
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
      createdAt: new Date().toISOString(),
      isFinding: input.isFinding,
    };
    investigation.notes = [note, ...investigation.notes];
    if (input.isFinding) {
      pushTimelineEvent(investigation, "Finding noted", input.content, input.authorName);
    } else {
      investigation.updatedAt = new Date().toISOString();
    }
    return note;
  }

  async linkIncident(id: string, incidentId: string, actorName: string): Promise<Investigation> {
    await delay(undefined, 400);
    const investigation = requireInvestigation(id);
    if (!investigation.relatedIncidentIds.includes(incidentId)) {
      const incident = MOCK_INCIDENTS.find((i) => i.id === incidentId);
      investigation.relatedIncidentIds = [...investigation.relatedIncidentIds, incidentId];
      pushTimelineEvent(
        investigation,
        "Linked incident",
        incident ? `${formatShortId(incident.id)} — ${incident.title}` : formatShortId(incidentId),
        actorName,
      );
    }
    return investigation;
  }

  async unlinkIncident(id: string, incidentId: string, actorName: string): Promise<Investigation> {
    await delay(undefined, 350);
    const investigation = requireInvestigation(id);
    investigation.relatedIncidentIds = investigation.relatedIncidentIds.filter((i) => i !== incidentId);
    pushTimelineEvent(investigation, "Unlinked incident", formatShortId(incidentId), actorName);
    return investigation;
  }

  async linkIndicator(id: string, indicatorId: string, actorName: string): Promise<Investigation> {
    await delay(undefined, 400);
    const investigation = requireInvestigation(id);
    if (!investigation.relatedIndicatorIds.includes(indicatorId)) {
      const indicator = MOCK_INDICATORS.find((i) => i.id === indicatorId);
      investigation.relatedIndicatorIds = [...investigation.relatedIndicatorIds, indicatorId];
      pushTimelineEvent(
        investigation,
        "Linked indicator",
        indicator ? indicator.value : indicatorId,
        actorName,
      );
    }
    return investigation;
  }

  async unlinkIndicator(id: string, indicatorId: string, actorName: string): Promise<Investigation> {
    await delay(undefined, 350);
    const investigation = requireInvestigation(id);
    investigation.relatedIndicatorIds = investigation.relatedIndicatorIds.filter((i) => i !== indicatorId);
    pushTimelineEvent(investigation, "Unlinked indicator", indicatorId, actorName);
    return investigation;
  }
}
