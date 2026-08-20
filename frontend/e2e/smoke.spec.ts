import { expect, test } from "@playwright/test";

test("landing → login → dashboard → every feature area, end to end", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Security operations/i })).toBeVisible();

  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email address").fill("avery.chen@northwind.test");
  // getByLabel("Password") also substring-matches the "Show password"
  // toggle button's aria-label, so target the input directly.
  await page.locator('input[type="password"]').fill("ThreatLens#Demo1");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

  // Incidents is a fully-built feature: list → detail, with real mock data.
  await page.getByRole("link", { name: "Incidents" }).click();
  await expect(page).toHaveURL(/\/app\/incidents$/);
  await expect(page.getByText(/Credential-harvesting phishing campaign/i)).toBeVisible();
  await page.getByText(/Credential-harvesting phishing campaign/i).click();
  await expect(page).toHaveURL(/\/app\/incidents\/inc_1$/);
  await expect(
    page.getByRole("heading", { name: /Credential-harvesting phishing campaign/i }),
  ).toBeVisible();

  // IOC Overview is also fully built: list → indicator detail.
  await page.getByRole("link", { name: "IOC Overview" }).click();
  await expect(page).toHaveURL(/\/app\/threat-intel$/);
  await expect(page.getByText("185.220.101.47")).toBeVisible();
  await page.getByText("185.220.101.47").click();
  await expect(page).toHaveURL(/\/app\/threat-intel\/ind_1$/);
  await expect(page.getByRole("heading", { name: "185.220.101.47" })).toBeVisible();

  // Threat Graph is also fully built: select a node, see its side panel.
  await page.getByRole("link", { name: "Threat Graph" }).click();
  await expect(page).toHaveURL(/\/app\/threat-graph$/);
  await expect(page.getByText("Select a node", { exact: true })).toBeVisible();
  await page.getByText("185.220.101.47").click();
  await expect(page.getByRole("complementary", { name: "Node details" }).getByText("View full details")).toBeVisible();

  // MITRE ATT&CK is also fully built: browser → technique detail.
  await page.getByRole("link", { name: "MITRE ATT&CK" }).click();
  await expect(page).toHaveURL(/\/app\/mitre$/);
  await expect(page.getByText("Phishing", { exact: true })).toBeVisible();
  await page.getByText("Phishing", { exact: true }).click();
  await expect(page).toHaveURL(/\/app\/mitre\/T1566$/);
  // The browser's technique cards (one of which is also named "Phishing")
  // can still be transiently mounted during the Suspense route transition,
  // so wait for detail-only content first rather than risk a strict-mode
  // violation on the ambiguous heading text.
  await expect(
    page.getByText("Adversaries send malicious messages to gain access to victim systems."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phishing", exact: true })).toBeVisible();

  // AI Assistant is also fully built: send a suggested prompt, see a reply.
  await page.getByRole("link", { name: "AI Assistant" }).click();
  await expect(page).toHaveURL(/\/app\/ai-assistant$/);
  await page.getByRole("button", { name: "Summarize INC-5" }).click();
  await expect(page.getByText(/Suspected C2 beaconing and data exfiltration/i)).toBeVisible();

  // Investigations is also fully built: open a case workspace and see its
  // linked incidents.
  await page.getByRole("link", { name: "Investigations" }).click();
  await expect(page).toHaveURL(/\/app\/investigations$/);
  await expect(page.getByText(/Finance-targeted phishing infrastructure cluster/i)).toBeVisible();
  await page.getByText(/Finance-targeted phishing infrastructure cluster/i).click();
  await expect(page).toHaveURL(/\/app\/investigations\/inv_1$/);
  await expect(
    page.getByRole("heading", { name: /Finance-targeted phishing infrastructure cluster/i }),
  ).toBeVisible();
  await expect(page.getByText("Linked incidents")).toBeVisible();

  // Reports is also fully built: open a report, then generate a new one.
  // Scoped to the primary nav — the breadcrumb on the incident/investigation
  // pages we just visited can leave stale "Reports"-named links around.
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/app\/reports$/);
  await expect(page.getByText(/Weekly Security Summary/i)).toBeVisible();
  await page.getByText(/Weekly Security Summary/i).click();
  await expect(page).toHaveURL(/\/app\/reports\/report_1$/);
  await expect(page.getByRole("heading", { name: /Weekly Security Summary/i })).toBeVisible();

  // Back to the list — the "Generate report" action lives there, not on
  // this detail page.
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/app\/reports$/);
  await page.getByRole("button", { name: "Generate report" }).click();
  const dialog = page.getByRole("dialog", { name: "Generate a report" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/Report type/).selectOption("risk_report");
  await dialog.getByLabel(/Title/).fill("Ad-hoc Risk Snapshot");
  await dialog.getByRole("button", { name: "Generate report" }).click();
  await expect(page.getByRole("heading", { name: "Ad-hoc Risk Snapshot" })).toBeVisible();

  // Users is also fully built: list → profile, with role/status editable
  // from the header card.
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Users" }).click();
  await expect(page).toHaveURL(/\/app\/users$/);
  await expect(page.getByText("Diego Alvarez")).toBeVisible();
  await page.getByText("Diego Alvarez").click();
  await expect(page).toHaveURL(/\/app\/users\/user_3$/);
  await expect(page.getByRole("heading", { name: "Diego Alvarez" })).toBeVisible();
  await expect(page.getByText("diego.alvarez@northwind.test")).toBeVisible();

  // Audit Logs is also fully built: search narrows the table.
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Audit Logs" }).click();
  await expect(page).toHaveURL(/\/app\/audit-logs$/);
  const auditSearch = page.getByPlaceholder("Search by actor, action, or resource…");
  await auditSearch.fill("login");
  await expect(page.getByRole("table").getByText("Avery Chen")).toBeVisible();

  // Settings is also fully built: tabbed profile/organization/security/etc.
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("tab", { name: "Security" }).click();
  await expect(page.getByRole("heading", { name: "Multi-factor authentication" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Require MFA at sign-in" })).toBeVisible();

  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("unauthenticated visit to a protected route redirects to sign in", async ({ page }) => {
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
