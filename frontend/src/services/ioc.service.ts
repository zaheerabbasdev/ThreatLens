import type { Indicator, IndicatorType, PageRequest, PaginatedResult, Severity } from "@/types";

export interface IOCSubmissionInput {
  type: IndicatorType;
  value: string;
  notes?: string;
}

export interface IOCListParams extends PageRequest {
  type?: IndicatorType;
  severity?: Severity;
}

export interface IOCService {
  submit(input: IOCSubmissionInput): Promise<Indicator>;
  list(params?: IOCListParams): Promise<PaginatedResult<Indicator>>;
  getById(id: string): Promise<Indicator | null>;
  enrich(id: string, force?: boolean): Promise<Indicator>;
}
