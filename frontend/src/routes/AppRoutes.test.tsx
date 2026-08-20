import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRoutes } from "./AppRoutes";
import { renderWithProviders, signInAs } from "@/testUtils";

function renderAt(path: string) {
  return renderWithProviders(<AppRoutes />, { route: path });
}

describe("AppRoutes", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the 404 page for an unknown route", async () => {
    renderAt("/this-page-does-not-exist");
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from protected routes to sign in", async () => {
    renderAt("/app/dashboard");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it(
    "lets an authenticated user reach the dashboard",
    async () => {
      signInAs();
      renderAt("/app/dashboard");

      // The dashboard is a lazy-loaded chunk that fans out several mocked
      // queries with simulated network latency, so this needs more room than
      // the default waitFor/test timeouts — especially under the resource
      // contention of the full suite running many files in parallel (more so
      // now that there are more lazy-loaded routes/chunks alongside it).
      await waitFor(
        () => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome back"),
        { timeout: 25000 },
      );
    },
    30000,
  );

  it(
    "lets an authenticated analyst open an incident from the list and act on it",
    async () => {
      signInAs();
      renderAt("/app/incidents");

      const row = await screen.findByText(
        /Credential-harvesting phishing campaign/i,
        {},
        { timeout: 15000 },
      );
      await userEvent.click(row);

      // Landed on the incident detail route with its real data rendered.
      await waitFor(
        () =>
          expect(
            screen.getByRole("heading", { name: /Credential-harvesting phishing campaign/i }),
          ).toBeInTheDocument(),
        { timeout: 15000 },
      );
      expect(screen.getByText("Phishing emails delivered")).toBeInTheDocument();

      // The AI analysis section is a separate, independently-loading query —
      // give it its own wait rather than assuming it settled alongside the
      // header content above.
      expect(
        await screen.findByText(/AI-generated analysis from a mocked assistant/i, {}, { timeout: 15000 }),
      ).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an authenticated user open an indicator from the IOC overview",
    async () => {
      signInAs();
      renderAt("/app/threat-intel");

      const row = await screen.findByText("185.220.101.47", {}, { timeout: 15000 });
      await userEvent.click(row);

      await waitFor(() => expect(screen.getByRole("heading", { name: "185.220.101.47" })).toBeInTheDocument(), {
        timeout: 15000,
      });
      // Type-specific details (IP) and a linked incident both resolved.
      expect(screen.getByText("Netherlands")).toBeInTheDocument();
      expect(
        await screen.findByText(/Distributed brute-force attempt/i, {}, { timeout: 15000 }),
      ).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an authenticated user select a node in the threat graph and see its connections",
    async () => {
      signInAs();
      renderAt("/app/threat-graph");

      expect(await screen.findByText("Select a node", {}, { timeout: 15000 })).toBeInTheDocument();

      const node = await screen.findByText("185.220.101.47", {}, { timeout: 15000 });
      // React Flow's pane wraps every node in d3-zoom's pan/drag handling,
      // which needs real pointer-capture APIs jsdom doesn't implement.
      // userEvent's realistic mousedown+mouseup sequence trips that; a plain
      // click event exercises the same onNodeClick handler without it.
      fireEvent.click(node);

      // The side panel now shows the selected indicator's details and its
      // linked incident as a connection. Scoped to the panel itself since
      // "IP Address" also appears as a filter chip label elsewhere on the page.
      const sidePanel = screen.getByRole("complementary", { name: "Node details" });
      await waitFor(() => expect(within(sidePanel).getByText("IP Address")).toBeInTheDocument(), {
        timeout: 5000,
      });
      expect(within(sidePanel).getByText(/View full details/i)).toBeInTheDocument();
      expect(within(sidePanel).getByText(/1 connection/i)).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an authenticated user open a technique from the MITRE browser and follow a sub-technique link",
    async () => {
      signInAs();
      renderAt("/app/mitre");

      const card = await screen.findByText("Phishing", {}, { timeout: 15000 });
      await userEvent.click(card);

      await waitFor(() => expect(screen.getByRole("heading", { name: "Phishing" })).toBeInTheDocument(), {
        timeout: 15000,
      });
      // Mapped incidents resolved, and the sub-technique link is present.
      expect(
        await screen.findByText(/Credential-harvesting phishing campaign/i, {}, { timeout: 15000 }),
      ).toBeInTheDocument();
      const subTechniqueLink = screen.getByRole("link", { name: /T1566\.002/i });
      await userEvent.click(subTechniqueLink);

      await waitFor(
        () => expect(screen.getByRole("heading", { name: "Phishing: Spearphishing Link" })).toBeInTheDocument(),
        { timeout: 15000 },
      );
      // The parent-technique backlink is shown on the sub-technique's page.
      expect(screen.getByRole("link", { name: /T1566 — Phishing/i })).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an authenticated user chat with the AI assistant via a suggested prompt",
    async () => {
      signInAs();
      renderAt("/app/ai-assistant");

      const prompt = await screen.findByRole("button", { name: "Summarize INC-5" }, { timeout: 15000 });
      await userEvent.click(prompt);

      expect(await screen.findByText("Summarize INC-5", {}, { timeout: 15000 })).toBeInTheDocument();
      await waitFor(
        () => expect(screen.getByText(/Suspected C2 beaconing and data exfiltration/i)).toBeInTheDocument(),
        { timeout: 15000 },
      );
      expect(screen.getByText("AI-generated")).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an authenticated user open an investigation, record a finding, and link an incident",
    async () => {
      signInAs();
      // Navigates straight to the workspace rather than clicking through
      // from the list — the list's own rendering/filtering/navigation is
      // already covered by InvestigationsList.test.tsx, and chaining two
      // separate lazy-loaded chunks (list, then detail) here made this
      // test's first-load transform time both slow and inconsistent.
      renderAt("/app/investigations/inv_1");

      await waitFor(
        () =>
          expect(
            screen.getByRole("heading", { name: /Finance-targeted phishing infrastructure cluster/i }),
          ).toBeInTheDocument(),
        { timeout: 15000 },
      );

      // Scoped to the "Linked incidents" card specifically: the investigation's
      // own timeline separately narrates "Linked incident — INC-1 —
      // Credential-harvesting phishing campaign…", so an unscoped text query
      // for the incident title matches two elements on this page and throws
      // rather than timing out.
      const linkedIncidentsCard = screen.getByText("Linked incidents").closest("div")
        ?.parentElement as HTMLElement;
      expect(
        await within(linkedIncidentsCard).findByText(/Credential-harvesting phishing campaign/i, {}, { timeout: 15000 }),
      ).toBeInTheDocument();
      expect(
        await within(linkedIncidentsCard).findByText(/Distributed brute-force attempt/i, {}, { timeout: 15000 }),
      ).toBeInTheDocument();

      // Record a finding.
      const noteField = screen.getByPlaceholderText("Record evidence, reasoning, or a conclusion…");
      await userEvent.type(noteField, "New finding: shared TLS certificate fingerprint.");
      await userEvent.click(screen.getByRole("checkbox", { name: "Mark as a key finding" }));
      await userEvent.click(screen.getByRole("button", { name: "Add note" }));

      // Marking the note as a finding also logs a matching timeline entry
      // (by design — see the mock service), so the note's text legitimately
      // appears twice on the page; assert presence rather than uniqueness.
      await waitFor(
        () =>
          expect(
            screen.getAllByText("New finding: shared TLS certificate fingerprint.").length,
          ).toBeGreaterThan(0),
        { timeout: 5000 },
      );
      // The fixture's existing note is also flagged as a finding, so there
      // are two "Key finding" tags on the page once ours is added.
      expect(screen.getAllByText("Key finding").length).toBeGreaterThanOrEqual(2);

      // Link an additional incident via the search-to-link picker.
      await userEvent.click(screen.getByRole("button", { name: "Link incident" }));
      const linkSearch = screen.getByPlaceholderText("Search incidents by title…");
      await userEvent.type(linkSearch, "Obfuscated");
      const candidate = await screen.findByText(/Obfuscated loader/i, {}, { timeout: 10000 });
      await userEvent.click(candidate);

      // The newly-linked incident now appears among the linked incidents.
      await waitFor(
        () => expect(screen.getAllByText(/Obfuscated loader/i).length).toBeGreaterThan(0),
        { timeout: 5000 },
      );
    },
    30000,
  );

  it(
    "lets an authenticated user open a report and generate a new one",
    async () => {
      signInAs();
      renderAt("/app/reports");

      const row = await screen.findByText(/Weekly Security Summary/i, {}, { timeout: 15000 });
      await userEvent.click(row);

      await waitFor(
        () => expect(screen.getByRole("heading", { name: /Weekly Security Summary/i })).toBeInTheDocument(),
        { timeout: 15000 },
      );
      // "Security Summary" legitimately appears twice (breadcrumb + the
      // page-level heading both show the report type).
      expect(screen.getAllByText("Security Summary").length).toBeGreaterThanOrEqual(2);
      expect(
        await screen.findByText("Organizational risk score", {}, { timeout: 15000 }),
      ).toBeInTheDocument();

      // Generate a new risk report and land on its detail page with real,
      // freshly-computed content (not a canned placeholder). Scoped to the
      // primary nav: the breadcrumb also has a "Reports" link.
      const primaryNav = screen.getByRole("navigation", { name: "Primary" });
      await userEvent.click(within(primaryNav).getByRole("link", { name: "Reports" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Generate report" })).toBeInTheDocument(), {
        timeout: 15000,
      });
      await userEvent.click(screen.getByRole("button", { name: "Generate report" }));

      // Scoped to the dialog: the page's own "Generate report" trigger
      // button is still in the DOM behind the modal (portalled, not
      // unmounted), and its submit button shares the same label.
      const dialog = screen.getByRole("dialog", { name: "Generate a report" });
      // getByLabelText matches the label's raw textContent, which includes
      // the visually-hidden "*" required-indicator span — use a substring
      // regex rather than an exact string.
      await userEvent.selectOptions(within(dialog).getByLabelText(/Report type/), "risk_report");
      await userEvent.type(within(dialog).getByLabelText(/Title/), "Ad-hoc Risk Snapshot");
      await userEvent.click(within(dialog).getByRole("button", { name: "Generate report" }));

      await waitFor(
        () => expect(screen.getByRole("heading", { name: "Ad-hoc Risk Snapshot" })).toBeInTheDocument(),
        { timeout: 15000 },
      );
      expect(screen.getAllByText("Risk Report").length).toBeGreaterThanOrEqual(2);
      expect(
        await screen.findByText("Organizational risk score", {}, { timeout: 15000 }),
      ).toBeInTheDocument();
    },
    30000,
  );

  it(
    "lets an admin open a user's profile from the list and change their role",
    async () => {
      signInAs(); // Avery Chen — super_admin, has users:manage
      renderAt("/app/users");

      const row = await screen.findByText("Diego Alvarez", {}, { timeout: 15000 });
      await userEvent.click(row);

      await waitFor(
        () => expect(screen.getByRole("heading", { name: "Diego Alvarez" })).toBeInTheDocument(),
        { timeout: 15000 },
      );
      expect(screen.getByText("diego.alvarez@northwind.test")).toBeInTheDocument();

      // Change the role via the header card's dropdown. Scoped to a button
      // role — the permissions card below also renders the role name as
      // plain text ("What the Security Analyst role grants…"), so an
      // unscoped text query would match twice.
      await userEvent.click(screen.getByRole("button", { name: "Security Analyst" }));
      await userEvent.click(await screen.findByRole("menuitem", { name: "Viewer" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "Viewer" })).toBeInTheDocument(), {
        timeout: 5000,
      });
    },
    30000,
  );

  it(
    "lets an authenticated user edit their display name from Settings",
    async () => {
      signInAs();
      renderAt("/app/settings");

      await waitFor(() => expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument(), {
        timeout: 15000,
      });

      const nameInput = await screen.findByLabelText(/Full name/, {}, { timeout: 15000 });
      expect(nameInput).toHaveValue("Avery Chen");
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "Avery C. Chen");
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      // The updated name legitimately renders twice once the session
      // refreshes — the Settings summary card and the topbar's user menu
      // both read the same signed-in user.
      await waitFor(
        () => expect(screen.getAllByText("Avery C. Chen").length).toBeGreaterThan(0),
        { timeout: 5000 },
      );
    },
    30000,
  );

  it(
    "lets an authenticated user browse and search audit logs",
    async () => {
      signInAs();
      renderAt("/app/audit-logs");

      await waitFor(() => expect(screen.getByRole("heading", { name: "Audit Logs" })).toBeInTheDocument(), {
        timeout: 15000,
      });

      // This test file's other cases each perform mutating, audit-logged
      // actions before this one runs, so the unfiltered first page isn't a
      // stable place to look for one specific fixture entry. Search for it
      // instead — the mock service filters before paginating, so a specific
      // match is guaranteed to surface regardless of how much other audit
      // history has accumulated by this point in the suite.
      const search = await screen.findByPlaceholderText(
        "Search by actor, action, or resource…",
        {},
        { timeout: 15000 },
      );
      await userEvent.type(search, "login");

      const table = screen.getByRole("table");
      await waitFor(() => expect(within(table).getByText("Avery Chen")).toBeInTheDocument(), {
        timeout: 15000,
      });
      expect(within(table).getByText("login")).toBeInTheDocument();
    },
    20000,
  );
});
