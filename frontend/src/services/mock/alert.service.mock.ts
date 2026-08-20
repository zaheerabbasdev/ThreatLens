import type { AlertListParams, AlertService, AlertSummary } from "@/services/alert.service";
import type { Alert, PaginatedResult, Severity, WorkflowStatus } from "@/types";
import { MOCK_ALERTS } from "@/mocks/alerts";
import { SEVERITY_ORDER } from "@/constants/severity";
import { delay, paginate } from "./util";

export class MockAlertService implements AlertService {
  async list(params?: AlertListParams): Promise<PaginatedResult<Alert>> {
    let items = [...MOCK_ALERTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (params?.severity) items = items.filter((a) => a.severity === params.severity);
    if (params?.status) items = items.filter((a) => a.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((a) => a.title.toLowerCase().includes(q));
    }
    // Cloned, not the live singleton references — see the note in
    // incident.service.mock.ts's list() for why this matters after a write.
    return delay(paginate(items.map((a) => ({ ...a })), params), 350);
  }

  async getById(id: string): Promise<Alert | null> {
    await delay(undefined, 300);
    const alert = MOCK_ALERTS.find((a) => a.id === id);
    return alert ? { ...alert } : null;
  }

  async getSummary(): Promise<AlertSummary> {
    const bySeverity = SEVERITY_ORDER.reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<Severity, number>,
    );
    for (const alert of MOCK_ALERTS) {
      bySeverity[alert.severity] += 1;
    }
    const unresolved = MOCK_ALERTS.filter(
      (a) => a.status === "open" || a.status === "investigating",
    ).length;
    return delay({ total: MOCK_ALERTS.length, unresolved, bySeverity }, 300);
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Alert> {
    await delay(undefined, 400);
    const alert = MOCK_ALERTS.find((a) => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found.`);
    alert.status = status;
    return alert;
  }
}
