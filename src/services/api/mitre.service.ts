import type { MitreService, MitreTechniqueListParams } from "@/services/mitre.service";
import type { MitreTactic, MitreTechnique } from "@/types";
import { apiRequest, apiRequestOrNull } from "./client";

export class ApiMitreService implements MitreService {
  listTactics(): Promise<MitreTactic[]> {
    return apiRequest<MitreTactic[]>("/mitre/tactics");
  }

  listTechniques(params?: MitreTechniqueListParams): Promise<MitreTechnique[]> {
    return apiRequest<MitreTechnique[]>("/mitre/techniques", { query: { tacticId: params?.tacticId, search: params?.search } });
  }

  getTechniqueById(id: string): Promise<MitreTechnique | null> {
    return apiRequestOrNull<MitreTechnique>(`/mitre/techniques/${id}`);
  }
}
