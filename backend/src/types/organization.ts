/** Mirrors the frontend's Organization type in src/types/user.ts. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "team" | "enterprise";
  createdAt: string;
}
