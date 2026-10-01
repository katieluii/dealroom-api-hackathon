import type Anthropic from "@anthropic-ai/sdk";
import { buildSyndicate, chemistry, conflictStatus } from "./engine";
import * as dealroom from "./dealroom";
import { revise, type Session } from "./session";
import type { Constraints, SlotName } from "./types";
const slots = ["lead", "follower1", "follower2", "strategic"];
const properties = {
  excludeInvestorIds: { type: "array", items: { type: "string" } },
  requireRegion: { type: "string" },
  excludeRegion: { type: "string" },
  forceSlot: {
    type: "object",
    properties: Object.fromEntries(slots.map((s) => [s, { type: "string" }])),
    additionalProperties: false,
  },
};
export const agentTools: Anthropic.Tool[] = [
  {
    name: "get_company",
    description:
      "Get the current company or a specific company record. All mock records are labelled.",
    input_schema: { type: "object", properties: { id: { type: "string" } } },
  },
  {
    name: "search_investors",
    description:
      "Search investors by stage, sector or geography. Returned investors must be present in the loaded round context before selecting them.",
    input_schema: {
      type: "object",
      properties: {
        stage: { type: "string" },
        sectors: { type: "array", items: { type: "string" } },
        hqCountry: { type: "string" },
        hqRegion: { type: "string" },
      },
    },
  },
  {
    name: "get_investor_portfolio",
    description:
      "Get investments and portfolio company records to support conflict checks.",
    input_schema: {
      type: "object",
      properties: { investorId: { type: "string" } },
      required: ["investorId"],
    },
  },
  {
    name: "get_current_round",
    description:
      "Get the full current round, selected investors, evidence, constraints, and available candidate IDs. Always call before discussing or changing a round.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "build_syndicate",
    description:
      "Rebuild the round. Constraints include excludeRegion (US, United States, Europe), requireRegion, excludeInvestorIds, forceSlot. Explicit exclusions take precedence. Returns any unfilled slots.",
    input_schema: {
      type: "object",
      properties: {
        constraints: {
          type: "object",
          properties,
          additionalProperties: false,
        },
      },
      required: ["constraints"],
    },
  },
  {
    name: "swap_slot",
    description:
      "Force an eligible investor into one slot. Rejects duplicate slots and hard conflicts.",
    input_schema: {
      type: "object",
      properties: {
        slot: { type: "string", enum: slots },
        investorId: { type: "string" },
      },
      required: ["slot", "investorId"],
    },
  },
  {
    name: "explain_slot",
    description:
      "Get the evidence, reasons, inferred lead count, and competitors behind a slot.",
    input_schema: {
      type: "object",
      properties: { slot: { type: "string", enum: slots } },
      required: ["slot"],
    },
  },
  {
    name: "check_conflict",
    description:
      "Screen investor portfolio overlap with the current company. This is a heuristic, not proof of a competitor conflict.",
    input_schema: {
      type: "object",
      properties: { investorId: { type: "string" } },
      required: ["investorId"],
    },
  },
];
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || value.length > 200)
    throw new Error("Expected a short string");
  return value;
}
export function parseConstraints(value: unknown): Constraints {
  const v = record(value),
    out: Constraints = {};
  if (v.requireRegion !== undefined) out.requireRegion = text(v.requireRegion);
  if (v.excludeRegion !== undefined) out.excludeRegion = text(v.excludeRegion);
  if (v.excludeInvestorIds !== undefined) {
    if (
      !Array.isArray(v.excludeInvestorIds) ||
      v.excludeInvestorIds.length > 100
    )
      throw new Error("Invalid exclusions");
    out.excludeInvestorIds = v.excludeInvestorIds.map(text);
  }
  if (v.forceSlot !== undefined) {
    const force = record(v.forceSlot);
    out.forceSlot = {};
    for (const [slot, id] of Object.entries(force)) {
      if (!slots.includes(slot)) throw new Error("Unknown slot");
      out.forceSlot[slot as SlotName] = text(id);
    }
  }
  return out;
}
export async function executeTool(
  session: Session,
  name: string,
  input: unknown,
): Promise<unknown> {
  const v = record(input);
  switch (name) {
    case "get_company":
      return v.id
        ? (session.dataset.companies.find((c) => c.id === v.id) ??
            (await dealroom.getCompany(text(v.id))))
        : session.round.company;
    case "get_current_round":
      return {
        round: session.round,
        mode: session.mode,
        candidates: session.dataset.investors,
      };
    case "search_investors": {
      const q: dealroom.InvestorQuery = {};
      if (v.stage) q.stage = text(v.stage);
      if (v.hqCountry) q.hqCountry = text(v.hqCountry);
      if (v.hqRegion) q.hqRegion = text(v.hqRegion);
      if (v.sectors) {
        if (!Array.isArray(v.sectors)) throw new Error("Invalid sectors");
        q.sectors = v.sectors.map(text);
      }
      return session.mode === "mock"
        ? session.dataset.investors.filter(
            (i) =>
              (!q.stage || i.stages.includes(q.stage)) &&
              (!q.hqCountry || i.hqCountry === q.hqCountry) &&
              (!q.hqRegion || i.hqRegion === q.hqRegion) &&
              (!q.sectors?.length ||
                i.sectors.some((s) => q.sectors?.includes(s))),
          )
        : await dealroom.searchInvestors(q);
    }
    case "get_investor_portfolio":
      return (
        session.context.portfolios[text(v.investorId)] ??
        (session.mode === "mock"
          ? []
          : await dealroom.getInvestorPortfolio(text(v.investorId)))
      );
    case "build_syndicate":
      return revise(session, {
        ...session.round.constraints,
        ...parseConstraints(v.constraints),
      });
    case "swap_slot": {
      const slot = text(v.slot);
      if (!slots.includes(slot)) throw new Error("Unknown slot");
      return revise(session, {
        ...session.round.constraints,
        forceSlot: {
          ...session.round.constraints.forceSlot,
          [slot]: text(v.investorId),
        },
      });
    }
    case "explain_slot": {
      const selected = session.round.slots.find((s) => s.slot === v.slot);
      if (!selected) throw new Error("Slot is unfilled");
      return {
        slot: selected,
        sharedEvidence:
          selected.slot === "lead"
            ? session.round.slots
                .filter((s) => s.slot !== "lead")
                .map((s) => ({
                  investor: s.investor.name,
                  ...s.chemistryWithLead,
                }))
            : selected.chemistryWithLead,
      };
    }
    case "check_conflict": {
      const investor = session.dataset.investors.find(
        (i) => i.id === v.investorId,
      );
      if (!investor) throw new Error("Investor is not loaded");
      return conflictStatus(
        investor,
        session.round.company,
        session.context.portfolios[investor.id] ?? [],
        session.round.asOf,
      );
    }
    default:
      throw new Error("Unknown tool " + name);
  }
}
export async function scriptedReply(
  session: Session,
  message: string,
): Promise<string> {
  const lower = message.toLowerCase(),
    lead = session.round.slots.find((s) => s.slot === "lead");
  if (
    /(non[ -]?us|not[ -]?us|not.*united states|not us.based)/.test(lower) &&
    lower.includes("lead")
  ) {
    const forced = { ...session.round.constraints.forceSlot };
    delete forced.lead;
    const proposal = buildSyndicate(
      session.round.company,
      session.dataset.investors,
      {
        ...session.round.constraints,
        excludeRegion: "United States",
        forceSlot: forced,
      },
      session.context,
    );
    const next = proposal.slots.find((s) => s.slot === "lead");
    if (!next) return "No eligible non-US lead in the loaded investors.";
    await executeTool(session, "swap_slot", {
      slot: "lead",
      investorId: next.investor.id,
    });
    return `${next.investor.name} (${next.investor.hqCountry}) is now lead. ${next.leadEvidence.led} of ${next.leadEvidence.total} rounds led; ${next.leadEvidence.inferred} inferred.`;
  }
  if (lower.includes("why") || lower.includes("explain")) {
    const name = lower.includes("strategic")
      ? "strategic"
      : lower.includes("follower")
        ? "follower1"
        : "lead";
    const slot = session.round.slots.find((s) => s.slot === name);
    if (!slot) return "This slot is unfilled. Relax the current constraints.";
    const evidence =
      name === "lead"
        ? session.round.slots.flatMap((s) => s.chemistryWithLead.evidence)
        : slot.chemistryWithLead.evidence;
    const dedup = [...new Map(evidence.map((e) => [e.roundId, e])).values()];
    return `${slot.investor.name}\n\n${slot.fit.reasons.slice(0, 3).join(". ")}.\n\n${slot.leadEvidence.led} of ${slot.leadEvidence.total} recorded rounds led; ${slot.leadEvidence.inferred} inferred.\n\nShared history: ${
      dedup
        .slice(0, 3)
        .map(
          (e) =>
            `${e.companyName}, ${e.stage}, ${e.date}${e.followedOn ? " (later raised again)" : ""}`,
        )
        .join("; ") || "No shared rounds in the loaded data"
    }.\n\n${slot.conflict.competitors[0] ? "Overlap to check: " + slot.conflict.competitors[0].company.name + ". " + slot.conflict.competitors[0].reasons.join("; ") : "No overlap found in the loaded portfolio."}`;
  }
  if (lower.includes("co-invest") || lower.includes("coinvest")) {
    if (!lead) return "No lead is selected.";
    const matches = session.dataset.investors
      .filter((i) => i.id !== lead.investor.id)
      .map((i) => ({
        investor: i,
        chemistry: chemistry(
          i,
          lead.investor,
          session.context.rounds,
          session.round.asOf,
        ),
      }))
      .filter((x) => x.chemistry.evidence.length)
      .sort((a, b) => b.chemistry.score - a.chemistry.score)
      .slice(0, 4);
    return (
      `Co-investors of ${lead.investor.name}:\n\n` +
      matches
        .map(
          (x) =>
            `${x.investor.name}: ${x.chemistry.evidence.length} shared rounds, including ${x.chemistry.evidence[0].companyName} (${x.chemistry.evidence[0].stage}, ${x.chemistry.evidence[0].date}).`,
        )
        .join("\n\n")
    );
  }
  return "Scripted demo mode supports “Why this lead?”, “Replace the lead with a non-US investor”, and “Who else has co-invested with the lead?”. Add ANTHROPIC_API_KEY to enable open-ended Claude tool use.";
}
