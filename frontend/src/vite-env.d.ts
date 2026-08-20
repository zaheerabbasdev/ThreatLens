/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the real ThreatLens backend (e.g. "http://localhost:4000/api/v1").
   * Unset by default — the frontend runs entirely on mock services with no
   * backend needed, same as every phase before Phase 12. Set this to opt
   * into the real API (see src/services/index.ts, src/services/api/).
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
