import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { mockData, portfoliosFor } from "./mock";
import { fitScore } from "./engine";
import type { Company, Dataset, Investment, Investor, Round } from "./types";

export interface InvestorQuery {
  stage?: string;
  sectors?: string[];
  hqCountry?: string;
  hqRegion?: string;
}
type Raw = Record<string, unknown>;
const object = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};
const rows = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.map(object) : [];
const string = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const number = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const names = (value: unknown): string[] =>
  rows(value)
    .map((v) => string(v.name))
    .filter(Boolean);
const mockMode = () => process.env.MOCK_MODE !== "false";
const memory = new Map<string, { at: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const cacheRoot = path.join(process.cwd(), "data/cache");
let token: { value: string; expires: number } | undefined;
let nextRequestAt = 0;

async function credentials(): Promise<Record<string, string>> {
  const file = process.env.DEALROOM_ENV_FILE;
  if (!file) return {};
  const source = await readFile(file, "utf8");
  return Object.fromEntries(
    source
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [
          l.slice(0, i).trim(),
          l
            .slice(i + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}
async function headers(): Promise<Record<string, string>> {
  const env = await credentials();
  const clientId = process.env.DEALROOM_CLIENT_ID || env.DEALROOM_CLIENT_ID;
  if (!clientId)
    throw new Error(
      "Dealroom client ID is missing. Configure the credentials file.",
    );
  let bearer = process.env.DEALROOM_API_KEY;
  if (!bearer) {
    if (token && token.expires > Date.now()) bearer = token.value;
    else {
      const secret =
        process.env.DEALROOM_CLIENT_SECRET || env.DEALROOM_CLIENT_SECRET;
      if (!secret) throw new Error("Dealroom OAuth credentials are missing.");
      const reply = await fetch("https://accounts.dealroom.co/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: secret,
          audience: "https://api.beta.dealroom.app",
          grant_type: "client_credentials",
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!reply.ok)
        throw new Error(
          `Dealroom authentication failed (HTTP ${reply.status}).`,
        );
      const payload = object(await reply.json());
      bearer = string(payload.access_token);
      if (!bearer) throw new Error("Dealroom returned no access token.");
      token = {
        value: bearer,
        expires:
          Date.now() + ((number(payload.expires_in) ?? 3600) - 60) * 1000,
      };
    }
  }
  return {
    Authorization: "Bearer " + bearer,
    "X-Client-Id": clientId,
    Accept: "application/json",
  };
}
async function api(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const base = process.env.DEALROOM_BASE_URL || "https://api.beta.dealroom.app";
  const url = new URL(endpoint, base);
  url.search = new URLSearchParams(params).toString();
  if (url.protocol !== "https:")
    throw new Error("Dealroom base URL must use HTTPS.");
  const key = createHash("sha256").update(url.href).digest("hex");
  const cached = memory.get(key);
  if (cached && Date.now() - cached.at < 900000) return cached.value;
  if (pending.has(key)) return pending.get(key)!;
  const load = (async () => {
    try {
      const disk = object(
        JSON.parse(await readFile(path.join(cacheRoot, key + ".json"), "utf8")),
      );
      if (number(disk.at) && Date.now() - Number(disk.at) < 900000) {
        memory.set(key, { at: Number(disk.at), value: disk.value });
        return disk.value;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        console.warn(
          "Dealroom cache could not be read; requesting fresh data.",
        );
    }
    const auth = await headers();
    const delay = Math.max(0, nextRequestAt - Date.now());
    nextRequestAt = Math.max(Date.now(), nextRequestAt) + 250;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const reply = await fetch(url, {
      headers: auth,
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!reply.ok) {
      const html = (reply.headers.get("content-type") ?? "").includes(
        "text/html",
      );
      throw new Error(
        `Dealroom returned HTTP ${reply.status}${html ? " (gateway block)" : ""}.`,
      );
    }
    const value: unknown = await reply.json();
    const entry = { at: Date.now(), value };
    memory.set(key, entry);
    await mkdir(cacheRoot, { recursive: true });
    const temp = path.join(cacheRoot, key + "." + randomUUID() + ".tmp");
    await writeFile(temp, JSON.stringify(entry, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temp, path.join(cacheRoot, key + ".json"));
    return value;
  })();
  pending.set(key, load);
  try {
    return await load;
  } finally {
    pending.delete(key);
  }
}
function hq(raw: Raw): { country: string; region: string } {
  const location = rows(raw.locations).find((l) => l.role === "hq") ?? {};
  return {
    country: string(object(location.country).name, "Unknown"),
    region: string(object(location.continent).name, "Unknown"),
  };
}
function sectors(raw: Raw): string[] {
  return rows(raw.taxonomy)
    .filter((t) => ["industry", "sub_industry"].includes(string(t.type)))
    .map((t) => string(t.name))
    .filter(Boolean);
}
function mapCompany(raw: Raw): Company {
  const id = string(raw.uuid),
    name = string(raw.name);
  if (!id || !name)
    throw new Error("Dealroom company record is missing its identity.");
  return {
    id,
    name,
    description: string(raw.about, string(raw.tagline)),
    stage: "Unknown",
    sectors: sectors(raw),
    ...hq(raw),
    foundedYear: Number(string(raw.launch_date).slice(0, 4)) || 0,
    totalRaised: number(object(raw.funding).total) ?? 0,
    investorIds: [],
  };
}
function mapInvestor(raw: Raw): Investor {
  const block = raw.investor ? object(raw.investor) : raw,
    types = rows(block.types)
      .map((t) => string(t.code) + " " + string(t.name))
      .join(" ")
      .toLowerCase(),
    location = hq(raw);
  const id = string(raw.uuid),
    name = string(raw.name);
  if (!id || !name)
    throw new Error("Dealroom investor record is missing its identity.");
  return {
    id,
    name,
    type: types.includes("corporat")
      ? "corporate"
      : types.includes("angel")
        ? "angel"
        : types.includes("venture")
          ? "vc"
          : "other",
    hqCountry: location.country,
    hqRegion: location.region,
    stages: names(block.stages),
    sectors: sectors(raw),
    typicalChequeMin: number(object(block.deal_size).min),
    typicalChequeMax: number(object(block.deal_size).max),
    lastInvestmentDate:
      string(object(block.investments).last_round_date) || undefined,
  };
}
export async function getRoundsForCompany(id: string): Promise<Round[]> {
  if (mockMode()) return mockData.rounds.filter((r) => r.companyId === id);
  const payload = object(
    await api("/data/companies/" + encodeURIComponent(id) + "/funding-rounds", {
      limit: "100",
    }),
  );
  return rows(payload.data)
    .filter((r) => r.is_vc_round === true && number(r.year) !== undefined)
    .map((r) => {
      const investors = rows(r.investors),
        ids = investors
          .map((i) => string(object(i.investor).uuid))
          .filter(Boolean),
        leads = investors
          .filter((i) => i.is_lead === true)
          .map((i) => string(object(i.investor).uuid))
          .filter(Boolean);
      return {
        id: String(r.id),
        companyId: id,
        stage: string(r.standardized_round, string(r.round_type, "Unknown")),
        date:
          String(r.year) +
          "-" +
          String(number(r.month) ?? 1).padStart(2, "0") +
          "-01",
        amount: number(r.amount),
        investorIds: ids,
        leadInvestorIds: leads,
        leadIsInferred: leads.length === 0,
      };
    });
}
export async function getCompany(id: string): Promise<Company> {
  if (mockMode()) {
    const company = mockData.companies.find((c) => c.id === id);
    if (!company) throw new Error("Company is not in the demo dataset.");
    return company;
  }
  const payload = object(
      await api("/data/companies/" + encodeURIComponent(id)),
    ),
    company = mapCompany(object(payload.data));
  const rounds = await getRoundsForCompany(id);
  const latest = [...rounds].sort((a, b) => b.date.localeCompare(a.date))[0];
  company.stage = latest?.stage ?? "Unknown";
  company.investorIds = [...new Set(rounds.flatMap((r) => r.investorIds))];
  return company;
}
export async function searchCompany(query: string): Promise<Company> {
  if (mockMode()) {
    const company = mockData.companies.find(
      (c) =>
        c.id === query || c.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (!query.trim() || !company)
      throw new Error("Demo data only. Use Load demo company.");
    return company;
  }
  let term = query.trim();
  if (/^https?:\/\//.test(term)) {
    const url = new URL(term);
    if (!/(^|\.)dealroom\.(co|app)$/.test(url.hostname))
      throw new Error("Use a company name or a Dealroom URL.");
    term = decodeURIComponent(
      url.pathname.split("/").filter(Boolean).pop() ?? "",
    ).replace(/[-_]/g, " ");
  }
  if (/^[0-9a-f-]{36}$/i.test(query)) return getCompany(query);
  const matches = rows(
    object(await api("/data/search", { q: term, types: "company", limit: "5" }))
      .data,
  );
  const match =
    matches.find((c) => string(c.name).toLowerCase() === term.toLowerCase()) ??
    matches[0];
  if (!match) throw new Error("No company found.");
  return getCompany(string(match.uuid));
}
export async function searchInvestors(
  q: InvestorQuery = {},
): Promise<Investor[]> {
  const investors = mockMode()
    ? mockData.investors
    : rows(
        object(await api("/data/investors", { limit: "25", view: "full" }))
          .data,
      ).map(mapInvestor);
  return investors.filter(
    (i) =>
      (!q.stage ||
        i.stages.some((s) => s.toLowerCase() === q.stage?.toLowerCase())) &&
      (!q.hqRegion || i.hqRegion === q.hqRegion) &&
      (!q.hqCountry || i.hqCountry === q.hqCountry) &&
      (!q.sectors?.length || i.sectors.some((s) => q.sectors?.includes(s))),
  );
}
export async function getInvestorPortfolio(id: string): Promise<Investment[]> {
  if (mockMode()) return portfoliosFor(mockData)[id] ?? [];
  const entries = rows(
      object(
        await api("/data/investors/" + encodeURIComponent(id) + "/portfolio", {
          limit: "2",
        }),
      ).data,
    ),
    investments: Investment[] = [];
  for (const entry of entries) {
    const company = await getCompany(string(object(entry.company).uuid));
    const rounds = await getRoundsForCompany(company.id);
    for (const round of rounds)
      if (round.investorIds.includes(id))
        investments.push({
          investorId: id,
          companyId: company.id,
          roundId: round.id,
          stage: round.stage,
          date: round.date,
          isLead: round.leadInvestorIds.includes(id),
          company,
        });
  }
  return investments;
}
export async function loadDataset(
  query: string,
  demo = false,
): Promise<{
  data: Dataset;
  company: Company;
  mode: "mock" | "live" | "cached";
  warning?: string;
}> {
  if (demo || mockMode())
    return {
      data: mockData,
      company: demo ? mockData.companies[0] : await searchCompany(query),
      mode: "mock",
    };
  const snapshot = path.join(
    cacheRoot,
    "dataset-v2-" +
      createHash("sha256").update(query.trim().toLowerCase()).digest("hex") +
      ".json",
  );
  try {
    const stored = JSON.parse(await readFile(snapshot, "utf8")) as {
      at: number;
      data: Dataset;
      company: Company;
    };
    if (Date.now() - stored.at < 900000)
      return {
        ...stored,
        mode: "cached",
        warning: "Sampled portfolios; verify coverage before outreach.",
      };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.warn("Dataset cache unreadable; rebuilding.");
  }
  try {
    const company = await searchCompany(query),
      pool = await searchInvestors();
    pool.sort(
      (a, b) => fitScore(b, company).score - fitScore(a, company).score,
    );
    const investors = [
      ...pool.filter((i) => i.type !== "corporate").slice(0, 8),
      ...pool.filter((i) => i.type === "corporate").slice(0, 4),
    ];
    const companies = new Map([[company.id, company]]),
      rounds = new Map<string, Round>();
    for (const investor of investors)
      for (const investment of await getInvestorPortfolio(investor.id))
        if (investment.company)
          companies.set(investment.companyId, investment.company);
    for (const peer of companies.values())
      for (const round of await getRoundsForCompany(peer.id))
        rounds.set(round.id, { ...round, companyName: peer.name });
    const data: Dataset = {
      companies: [...companies.values()],
      investors,
      rounds: [...rounds.values()],
    };
    await mkdir(cacheRoot, { recursive: true });
    const temp = snapshot + "." + randomUUID() + ".tmp";
    await writeFile(
      temp,
      JSON.stringify({ at: Date.now(), data, company }, null, 2) + "\n",
      { mode: 0o600 },
    );
    await rename(temp, snapshot);
    return {
      data,
      company,
      mode: "live",
      warning:
        "Sample: up to 12 investors and 2 portfolio companies each. Stage is the latest disclosed VC round; dates are rounded to month.",
    };
  } catch (error) {
    return {
      data: mockData,
      company: mockData.companies[0],
      mode: "mock",
      warning:
        (error instanceof Error ? error.message : "Dealroom is unavailable.") +
        " Showing the fictional demo company.",
    };
  }
}
