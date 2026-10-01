import type {
  Chemistry,
  Company,
  Conflict,
  Constraints,
  EngineContext,
  Fit,
  Investor,
  Investment,
  LeadEvidence,
  Round,
  Slot,
  SlotName,
  Syndicate,
} from "./types";
const DAY = 86400000;
const uniqueRounds = (rounds: Round[]) => [
  ...new Map(rounds.map((r) => [r.id, r])).values(),
];
const normalise = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
export function regionMatches(investor: Investor, region: string): boolean {
  const aliases: Record<string, string> = {
    us: "unitedstates",
    usa: "unitedstates",
    uk: "unitedkingdom",
    eu: "europe",
  };
  const wanted = aliases[normalise(region)] ?? normalise(region);
  return [investor.hqCountry, investor.hqRegion].some(
    (v) => (aliases[normalise(v)] ?? normalise(v)) === wanted,
  );
}
export function chemistry(
  a: Investor | string,
  b: Investor | string,
  rounds: Round[],
  asOf = new Date().toISOString(),
): Chemistry {
  const aid = typeof a === "string" ? a : a.id,
    bid = typeof b === "string" ? b : b.id;
  if (aid === bid) return { score: 0, evidence: [] };
  const now = Date.parse(asOf),
    history = uniqueRounds(rounds).filter(
      (r) => Number.isFinite(Date.parse(r.date)) && Date.parse(r.date) <= now,
    );
  const shared = history.filter(
    (r) => r.investorIds.includes(aid) && r.investorIds.includes(bid),
  );
  let score = 0;
  const evidence = shared.map((r) => {
    const yearsAgo = Math.max(0, (now - Date.parse(r.date)) / (365.25 * DAY));
    const followedOn = history.some(
      (other) =>
        other.companyId === r.companyId &&
        Date.parse(other.date) > Date.parse(r.date),
    );
    score += Math.pow(0.5, yearsAgo / 3) * (followedOn ? 1.5 : 1);
    return {
      companyName: r.companyName ?? r.companyId,
      companyId: r.companyId,
      roundId: r.id,
      stage: r.stage,
      date: r.date,
      followedOn,
    };
  });
  return { score, evidence };
}
export function inferredLeads(round: Round): {
  ids: string[];
  inferred: boolean;
} {
  if (round.leadInvestorIds.length)
    return { ids: round.leadInvestorIds, inferred: round.leadIsInferred };
  const cheques = Object.entries(round.investorCheques ?? {})
    .filter(
      ([id, v]) =>
        round.investorIds.includes(id) && Number.isFinite(v) && v > 0,
    )
    .sort((a, b) => b[1] - a[1]);
  return {
    ids: cheques.length ? [cheques[0][0]] : round.investorIds.slice(0, 1),
    inferred: true,
  };
}
export function leadScore(investor: Investor, rounds: Round[]): LeadEvidence {
  const participated = uniqueRounds(rounds).filter((r) =>
    r.investorIds.includes(investor.id),
  );
  let led = 0,
    inferred = 0;
  for (const round of participated) {
    const lead = inferredLeads(round);
    if (lead.ids.includes(investor.id)) {
      led++;
      if (lead.inferred) inferred++;
    }
  }
  return {
    score: participated.length ? led / participated.length : 0,
    led,
    total: participated.length,
    inferred,
  };
}
export function fitScore(
  investor: Investor,
  company: Company,
  asOf = new Date().toISOString(),
): Fit {
  const overlap = company.sectors.filter((s) =>
    investor.sectors.some((t) => normalise(s) === normalise(t)),
  );
  const stage = investor.stages.some(
    (s) => normalise(s) === normalise(company.stage),
  );
  const geography =
    regionMatches(investor, company.country) ||
    regionMatches(investor, company.region);
  const age = investor.lastInvestmentDate
    ? (Date.parse(asOf) - Date.parse(investor.lastInvestmentDate)) / DAY
    : Infinity;
  const recent = age >= 0 && age <= 730;
  return {
    score:
      overlap.length * 3 +
      (stage ? 4 : 0) +
      (geography ? 2 : 0) +
      (recent ? 1 : 0),
    reasons: [
      overlap.length
        ? overlap.join(" + ") + " investment focus"
        : "Category fit not established",
      stage ? company.stage + " investor" : "Stage fit not established",
      geography
        ? "Invests from " + investor.hqRegion
        : "Based in " + investor.hqRegion,
      recent
        ? "Recorded activity within two years"
        : "Recent activity unverified",
    ],
  };
}
function stageBand(stage: string): string {
  const s = normalise(stage);
  return ["preseed", "seed"].includes(s)
    ? "seed"
    : ["seriesa", "seriesb"].includes(s)
      ? "venture"
      : s;
}
export function conflictStatus(
  investor: Investor,
  company: Company,
  portfolio: Investment[],
  asOf = new Date().toISOString(),
): Conflict {
  const competitors: Conflict["competitors"] = [];
  let status: Conflict["status"] = "clear";
  const seen = new Set<string>();
  for (const investment of portfolio) {
    if (
      investment.investorId !== investor.id ||
      investment.companyId === company.id
    )
      continue;
    const peer = investment.company,
      age = (Date.parse(asOf) - Date.parse(investment.date)) / (365.25 * DAY);
    if (
      !peer ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > 4 ||
      seen.has(peer.id)
    )
      continue;
    const overlap = peer.sectors.filter((s) =>
      company.sectors.some((t) => normalise(s) === normalise(t)),
    );
    if (!overlap.length) continue;
    const sameStage = stageBand(peer.stage) === stageBand(company.stage),
      sameRegion = normalise(peer.region) === normalise(company.region);
    const hard = overlap.length >= 2 && sameStage && sameRegion;
    if (hard) status = "hard";
    else if (status === "clear") status = "soft";
    competitors.push({
      company: peer,
      date: investment.date,
      reasons: [
        overlap.length +
          " overlapping sector tag" +
          (overlap.length === 1 ? "" : "s") +
          ": " +
          overlap.join(", "),
        sameStage ? "Same stage band" : "Different stage band",
        sameRegion ? "Same region" : "Different region",
      ],
    });
    seen.add(peer.id);
  }
  return { status, competitors };
}
const slotOrder: SlotName[] = ["lead", "follower1", "follower2", "strategic"];
export function buildSyndicate(
  company: Company,
  candidates: Investor[],
  constraints: Constraints = {},
  context: EngineContext = { rounds: [], portfolios: {} },
): Syndicate {
  const asOf = context.asOf ?? new Date().toISOString(),
    rounds = uniqueRounds(context.rounds).filter(
      (r) => Date.parse(r.date) <= Date.parse(asOf),
    );
  const unique = [...new Map(candidates.map((i) => [i.id, i])).values()];
  const eligible = unique.filter(
    (i) =>
      !constraints.excludeInvestorIds?.includes(i.id) &&
      (!constraints.requireRegion ||
        regionMatches(i, constraints.requireRegion)) &&
      (!constraints.excludeRegion ||
        !regionMatches(i, constraints.excludeRegion)),
  );
  const facts = new Map(
    eligible.map((i) => [
      i.id,
      {
        fit: fitScore(i, company, asOf),
        lead: leadScore(i, rounds),
        conflict: conflictStatus(
          i,
          company,
          context.portfolios[i.id] ?? [],
          asOf,
        ),
      },
    ]),
  );
  const forced = Object.entries(constraints.forceSlot ?? {});
  if (new Set(forced.map(([, id]) => id)).size !== forced.length)
    throw new Error("One investor cannot occupy two round slots.");
  for (const [slot, id] of forced) {
    if (!slotOrder.includes(slot as SlotName))
      throw new Error("Unknown round slot.");
    const investor = eligible.find((i) => i.id === id);
    if (!investor)
      throw new Error(
        "The selected investor conflicts with an exclusion or geography constraint.",
      );
    if (facts.get(id)?.conflict.status === "hard")
      throw new Error(
        "This investor has a hard competitor conflict. Choose an alternative.",
      );
    if (slot !== "strategic" && investor.type === "corporate")
      throw new Error(
        "Corporate investors occupy the strategic slot. Choose a VC for this slot.",
      );
    if (
      slot === "strategic" &&
      investor.type !== "corporate" &&
      !investor.corporateBacking
    )
      throw new Error("The strategic slot needs a corporate investor.");
  }
  const reserved = new Map(forced.map(([slot, id]) => [id, slot])),
    used = new Set<string>(),
    slots: Slot[] = [],
    warnings: string[] = [];
  for (const slot of slotOrder) {
    const lead = slots.find((s) => s.slot === "lead")?.investor;
    const score = (i: Investor) => {
      const f = facts.get(i.id)!;
      if (slot === "lead") return f.lead.score * f.fit.score;
      if (slot === "strategic") return f.fit.score;
      return (lead ? chemistry(i, lead, rounds, asOf).score : 0) + f.fit.score;
    };
    const pool = eligible
      .filter(
        (i) =>
          !used.has(i.id) &&
          facts.get(i.id)!.conflict.status !== "hard" &&
          (!reserved.has(i.id) || reserved.get(i.id) === slot) &&
          (slot !== "strategic" ||
            i.type === "corporate" ||
            i.corporateBacking) &&
          (slot === "strategic" || i.type !== "corporate"),
      )
      .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
    const chosen = constraints.forceSlot?.[slot]
      ? pool.find((i) => i.id === constraints.forceSlot?.[slot])
      : pool[0];
    if (!chosen) {
      warnings.push(
        "No eligible investor for " +
          slot +
          ". Relax constraints or load more candidates.",
      );
      continue;
    }
    const f = facts.get(chosen.id)!;
    used.add(chosen.id);
    slots.push({
      slot,
      investor: chosen,
      fit: f.fit,
      leadEvidence: f.lead,
      chemistryWithLead: lead
        ? chemistry(chosen, lead, rounds, asOf)
        : { score: 0, evidence: [] },
      conflict: f.conflict,
      reasons:
        slot === "lead"
          ? [
              ...f.fit.reasons,
              `${f.lead.led} of ${f.lead.total} recorded rounds led (${f.lead.inferred} inferred)`,
            ]
          : f.fit.reasons,
      alternatives: pool.filter((i) => i.id !== chosen.id).slice(0, 3),
    });
  }
  for (const slot of slots)
    slot.alternatives = eligible
      .filter(
        (i) =>
          !used.has(i.id) &&
          facts.get(i.id)!.conflict.status !== "hard" &&
          (slot.slot !== "strategic" ||
            i.type === "corporate" ||
            i.corporateBacking) &&
          (slot.slot === "strategic" || i.type !== "corporate"),
      )
      .sort((a, b) => facts.get(b.id)!.fit.score - facts.get(a.id)!.fit.score)
      .slice(0, 3);
  const rejected = eligible.filter(
    (i) => facts.get(i.id)!.conflict.status === "hard",
  );
  if (rejected.length)
    warnings.push(
      `${rejected.length} candidates excluded by the competitor-overlap rule.`,
    );
  warnings.push(
    "Co-investment and competitor overlap are screening signals, not verified personal relationships or legal conflicts.",
  );
  return { company, slots, constraints, warnings, asOf };
}
