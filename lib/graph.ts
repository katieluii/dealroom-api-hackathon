import type { GraphData, Syndicate } from "./types";
export const slotLabels = {
  lead: "Lead",
  follower1: "Follower 1",
  follower2: "Follower 2",
  strategic: "Strategic",
};
export function roundGraph(round: Syndicate): GraphData {
  const positions: Record<string, [number, number]> = {
    lead: [-190, -95],
    follower1: [185, -105],
    follower2: [190, 125],
    strategic: [-180, 140],
  };
  const nodes = [
    {
      id: round.company.id,
      name: round.company.name,
      role: "Company",
      conflict: "clear" as const,
      fx: 0,
      fy: 0,
    },
    ...round.slots.map((s) => ({
      id: s.investor.id,
      name: s.investor.name,
      role: slotLabels[s.slot],
      conflict: s.conflict.status,
      fx: positions[s.slot][0],
      fy: positions[s.slot][1],
    })),
  ];
  const lead = round.slots.find((s) => s.slot === "lead");
  const links: GraphData["links"] = round.slots.map((s) => ({
    source: round.company.id,
    target: s.investor.id,
    count: 0,
    kind: "round",
    label: slotLabels[s.slot],
  }));
  if (lead)
    for (const s of round.slots) {
      if (s.slot === "lead" || !s.chemistryWithLead.evidence.length) continue;
      links.push({
        source: lead.investor.id,
        target: s.investor.id,
        count: s.chemistryWithLead.evidence.length,
        kind: "chemistry",
        label: s.chemistryWithLead.evidence.length + " shared rounds",
      });
    }
  return { nodes, links };
}
