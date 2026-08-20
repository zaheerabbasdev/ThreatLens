import type { MitreService, MitreTechniqueListParams } from "@/services/mitre.service";
import type { MitreTactic, MitreTechnique } from "@/types";
import { MOCK_TACTICS, MOCK_TECHNIQUES } from "@/mocks/mitre";
import { delay } from "./util";

export class MockMitreService implements MitreService {
  async listTactics(): Promise<MitreTactic[]> {
    return delay(MOCK_TACTICS, 250);
  }

  async listTechniques(params?: MitreTechniqueListParams): Promise<MitreTechnique[]> {
    let items = [...MOCK_TECHNIQUES];
    if (params?.tacticId) {
      items = items.filter((t) => t.tacticIds.includes(params.tacticId as string));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      );
    }
    return delay(items, 300);
  }

  async getTechniqueById(id: string): Promise<MitreTechnique | null> {
    await delay(undefined, 250);
    return MOCK_TECHNIQUES.find((t) => t.id === id) ?? null;
  }
}
