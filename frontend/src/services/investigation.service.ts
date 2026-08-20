import type {
  Investigation,
  InvestigationNote,
  PageRequest,
  PaginatedResult,
  WorkflowStatus,
} from "@/types";

export interface InvestigationListParams extends PageRequest {
  status?: WorkflowStatus;
}

export interface CreateInvestigationInput {
  title: string;
  description: string;
  leadAnalystId: string;
}

export interface AddInvestigationNoteInput {
  content: string;
  authorId: string;
  authorName: string;
  isFinding: boolean;
}

/**
 * A cross-incident case workspace — analysts correlate evidence, link
 * incidents/indicators, and record findings here, distinct from the
 * single-event Incident record itself.
 */
export interface InvestigationService {
  list(params?: InvestigationListParams): Promise<PaginatedResult<Investigation>>;
  getById(id: string): Promise<Investigation | null>;
  create(input: CreateInvestigationInput): Promise<Investigation>;
  updateStatus(id: string, status: WorkflowStatus, actorName: string): Promise<Investigation>;
  addNote(id: string, input: AddInvestigationNoteInput): Promise<InvestigationNote>;
  linkIncident(id: string, incidentId: string, actorName: string): Promise<Investigation>;
  unlinkIncident(id: string, incidentId: string, actorName: string): Promise<Investigation>;
  linkIndicator(id: string, indicatorId: string, actorName: string): Promise<Investigation>;
  unlinkIndicator(id: string, indicatorId: string, actorName: string): Promise<Investigation>;
}
