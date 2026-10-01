export type InvestorType = "vc" | "corporate" | "angel" | "other";
export interface Company {
  id: string;
  name: string;
  description: string;
  stage: string;
  sectors: string[];
  country: string;
  region: string;
  foundedYear: number;
  totalRaised: number;
  investorIds: string[];
}
export interface Investor {
  id: string;
  name: string;
  type: InvestorType;
  hqCountry: string;
  hqRegion: string;
  stages: string[];
  sectors: string[];
  typicalChequeMin?: number;
  typicalChequeMax?: number;
  lastInvestmentDate?: string;
  corporateBacking?: boolean;
}
export interface Round {
  id: string;
  companyId: string;
  companyName?: string;
  stage: string;
  date: string;
  amount?: number;
  investorIds: string[];
  leadInvestorIds: string[];
  leadIsInferred: boolean;
  investorCheques?: Record<string, number>;
}
export interface Investment {
  investorId: string;
  companyId: string;
  roundId: string;
  stage: string;
  date: string;
  isLead?: boolean;
  company?: Company;
}
export interface ChemistryEvidence {
  companyName: string;
  companyId: string;
  roundId: string;
  stage: string;
  date: string;
  followedOn: boolean;
}
export interface Chemistry {
  score: number;
  evidence: ChemistryEvidence[];
}
export interface Fit {
  score: number;
  reasons: string[];
}
export interface LeadEvidence {
  score: number;
  led: number;
  total: number;
  inferred: number;
}
export type ConflictLevel = "hard" | "soft" | "clear";
export interface Conflict {
  status: ConflictLevel;
  competitors: { company: Company; reasons: string[]; date: string }[];
}
export type SlotName = "lead" | "follower1" | "follower2" | "strategic";
export interface Constraints {
  excludeInvestorIds?: string[];
  requireRegion?: string;
  excludeRegion?: string;
  forceSlot?: Partial<Record<SlotName, string>>;
}
export interface EngineContext {
  rounds: Round[];
  portfolios: Record<string, Investment[]>;
  asOf?: string;
}
export interface Slot {
  slot: SlotName;
  investor: Investor;
  fit: Fit;
  leadEvidence: LeadEvidence;
  chemistryWithLead: Chemistry;
  conflict: Conflict;
  reasons: string[];
  alternatives: Investor[];
}
export interface Syndicate {
  company: Company;
  slots: Slot[];
  constraints: Constraints;
  warnings: string[];
  asOf: string;
}
export interface Dataset {
  companies: Company[];
  investors: Investor[];
  rounds: Round[];
}
export interface GraphNode {
  id: string;
  name: string;
  role: string;
  conflict: ConflictLevel;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}
export interface GraphLink {
  source: string;
  target: string;
  count: number;
  kind: "round" | "chemistry";
  label: string;
}
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
export type DataMode = "mock" | "live" | "cached";
export interface RoundResponse {
  sessionId: string;
  round: Syndicate;
  graph: GraphData;
  message: string;
  mode: DataMode;
  warning?: string;
  agentMode: "claude" | "scripted";
  changedSlots: SlotName[];
}
