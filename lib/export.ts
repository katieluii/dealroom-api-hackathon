import type { DataMode, Syndicate } from "./types";
import { slotLabels } from "./graph";
export function exportPlan(round: Syndicate, mode: DataMode): string {
  const lines = [
    `# Round plan: ${round.company.name}`,
    `${round.company.stage} | ${round.company.country} | ${mode === "mock" ? "MOCK DATA: illustrative only" : mode.toUpperCase() + " DATA: verify before outreach"}`,
    `As of ${round.asOf.slice(0, 10)}`,
    "",
    "## Approach order",
  ];
  round.slots.forEach((s, index) => {
    lines.push(
      `${index + 1}. **${slotLabels[s.slot]}: ${s.investor.name}** (${s.investor.hqCountry})`,
      `   ${s.fit.reasons.slice(0, 3).join("; ")}.`,
      s.slot === "lead"
        ? `   Led ${s.leadEvidence.led} of ${s.leadEvidence.total} observed rounds; ${s.leadEvidence.inferred} inferred.`
        : `   ${s.chemistryWithLead.evidence.length} recorded co-investments with the lead.`,
      `   Conflict screen: ${s.conflict.status}.`,
    );
  });
  lines.push("", "## Conflicts to check");
  for (const s of round.slots)
    if (s.conflict.competitors.length)
      lines.push(
        `- ${s.investor.name}: ${s.conflict.competitors
          .slice(0, 2)
          .map((c) => `${c.company.name} (${c.reasons.join("; ")})`)
          .join(
            " / ",
          )}.${s.conflict.competitors.length > 2 ? " " + (s.conflict.competitors.length - 2) + " more overlaps in the app." : ""}`,
      );
  lines.push("", "## Co-investment evidence");
  const seen = new Set<string>();
  for (const s of round.slots)
    for (const e of s.chemistryWithLead.evidence) {
      const key = e.roundId;
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size <= 6)
        lines.push(
          `- ${e.companyName}, ${e.stage}, ${e.date}${e.followedOn ? "; subsequently raised again" : ""}.`,
        );
    }
  if (seen.size > 6)
    lines.push(
      `- ${seen.size - 6} additional shared rounds available in the app.`,
    );
  lines.push(
    "",
    "Approach the lead first, validate availability and conflicts, then approach followers and the strategic investor. Co-investment is not evidence of a warm personal introduction. No outreach has been sent.",
  );
  return lines.join("\n");
}
