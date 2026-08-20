import type {
  Incident,
  IncidentNote,
  PageRequest,
  PaginatedResult,
  Severity,
  WorkflowStatus,
} from "@/types";

export interface IncidentListParams extends PageRequest {
  severity?: Severity;
  status?: WorkflowStatus;
}

export interface IncidentSummary {
  total: number;
  open: number;
  bySeverity: Record<Severity, number>;
}

export interface AddIncidentNoteInput {
  content: string;
  authorId: string;
  authorName: string;
}

export interface IncidentService {
  list(params?: IncidentListParams): Promise<PaginatedResult<Incident>>;
  getById(id: string): Promise<Incident | null>;
  getByIds(ids: string[]): Promise<Incident[]>;
  getSummary(): Promise<IncidentSummary>;
  updateStatus(id: string, status: WorkflowStatus): Promise<Incident>;
  assign(id: string, analystId: string | null): Promise<Incident>;
  addNote(id: string, input: AddIncidentNoteInput): Promise<IncidentNote>;
}
