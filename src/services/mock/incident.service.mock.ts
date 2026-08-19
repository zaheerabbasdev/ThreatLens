import type {
  AddIncidentNoteInput,
  IncidentListParams,
  IncidentService,
  IncidentSummary,
} from "@/services/incident.service";
import type { Incident, IncidentNote, PaginatedResult, Severity, WorkflowStatus } from "@/types";
import { MOCK_INCIDENTS } from "@/mocks/incidents";
import { SEVERITY_ORDER } from "@/constants/severity";
import { generateId } from "@/utils/id";
import { delay, paginate } from "./util";

function requireIncident(id: string): Incident {
  const incident = MOCK_INCIDENTS.find((i) => i.id === id);
  if (!incident) throw new Error(`Incident ${id} not found.`);
  return incident;
}

export class MockIncidentService implements IncidentService {
  async list(params?: IncidentListParams): Promise<PaginatedResult<Incident>> {
    let items = [...MOCK_INCIDENTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (params?.severity) items = items.filter((i) => i.severity === params.severity);
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

  async getById(id: string): Promise<Incident | null> {
    await delay(undefined, 300);
    const incident = MOCK_INCIDENTS.find((i) => i.id === id);
    return incident ? { ...incident } : null;
  }

  async getByIds(ids: string[]): Promise<Incident[]> {
    await delay(undefined, 250);
    const idSet = new Set(ids);
    return MOCK_INCIDENTS.filter((i) => idSet.has(i.id)).map((i) => ({ ...i }));
  }

  async getSummary(): Promise<IncidentSummary> {
    const bySeverity = SEVERITY_ORDER.reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<Severity, number>,
    );
    for (const incident of MOCK_INCIDENTS) {
      bySeverity[incident.severity] += 1;
    }
    const open = MOCK_INCIDENTS.filter(
      (i) => i.status !== "resolved" && i.status !== "closed" && i.status !== "false_positive",
    ).length;
    return delay(
      { total: MOCK_INCIDENTS.length, open, bySeverity },
      300,
    );
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Incident> {
    await delay(undefined, 400);
    const incident = requireIncident(id);
    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    return incident;
  }

  async assign(id: string, analystId: string | null): Promise<Incident> {
    await delay(undefined, 400);
    const incident = requireIncident(id);
    incident.assignedAnalystId = analystId ?? undefined;
    incident.updatedAt = new Date().toISOString();
    return incident;
  }

  async addNote(id: string, input: AddIncidentNoteInput): Promise<IncidentNote> {
    await delay(undefined, 400);
    const incident = requireIncident(id);
    const note: IncidentNote = {
      id: generateId("note"),
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    incident.notes = [note, ...incident.notes];
    incident.updatedAt = new Date().toISOString();
    return note;
  }
}
