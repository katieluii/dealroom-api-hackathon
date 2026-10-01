import { randomUUID } from "node:crypto";
import { buildSyndicate } from "./engine";
import { roundGraph } from "./graph";
import { mockData, portfoliosFor } from "./mock";
import { loadDataset } from "./dealroom";
import type {
  Constraints,
  Dataset,
  DataMode,
  EngineContext,
  RoundResponse,
  SlotName,
  Syndicate,
} from "./types";
export interface Session {
  id: string;
  dataset: Dataset;
  context: EngineContext;
  round: Syndicate;
  mode: DataMode;
  warning?: string;
  updated: number;
  busy: boolean;
}
const sessionStore = globalThis as typeof globalThis & {
  miChiSessions?: Map<string, Session>;
};
const sessions = (sessionStore.miChiSessions ??= new Map<string, Session>());
export async function createSession(
  query: string,
  demo: boolean,
): Promise<Session> {
  const loaded = await loadDataset(query, demo);
  const context = {
    rounds: loaded.data.rounds,
    portfolios: portfoliosFor(loaded.data),
  };
  const session: Session = {
    id: randomUUID(),
    dataset: loaded.data,
    context,
    round: buildSyndicate(loaded.company, loaded.data.investors, {}, context),
    mode: loaded.mode,
    warning: loaded.warning,
    updated: Date.now(),
    busy: false,
  };
  for (const [id, s] of sessions)
    if (Date.now() - s.updated > 3600000) sessions.delete(id);
  if (sessions.size >= 100) {
    const first = sessions.keys().next().value;
    if (first) sessions.delete(first);
  }
  sessions.set(session.id, session);
  return session;
}
export function getSession(id?: string): Session | undefined {
  if (!id) return;
  const s = sessions.get(id);
  if (s && Date.now() - s.updated < 3600000) {
    s.updated = Date.now();
    return s;
  }
  sessions.delete(id);
}
export function createDefaultSession(): Session {
  const context = {
    rounds: mockData.rounds,
    portfolios: portfoliosFor(mockData),
  };
  const s: Session = {
    id: randomUUID(),
    dataset: mockData,
    context,
    round: buildSyndicate(
      mockData.companies[0],
      mockData.investors,
      {},
      context,
    ),
    mode: "mock",
    updated: Date.now(),
    busy: false,
  };
  sessions.set(s.id, s);
  return s;
}
export function revise(session: Session, constraints: Constraints): Syndicate {
  const round = buildSyndicate(
    session.round.company,
    session.dataset.investors,
    constraints,
    session.context,
  );
  session.round = round;
  return round;
}
export function response(
  session: Session,
  message: string,
  before?: Syndicate,
  agentMode: "claude" | "scripted" = "scripted",
): RoundResponse {
  const changedSlots: SlotName[] = before
    ? (["lead", "follower1", "follower2", "strategic"] as SlotName[]).filter(
        (slot) =>
          before.slots.find((s) => s.slot === slot)?.investor.id !==
          session.round.slots.find((s) => s.slot === slot)?.investor.id,
      )
    : [];
  return {
    sessionId: session.id,
    round: session.round,
    graph: roundGraph(session.round),
    message,
    mode: session.mode,
    warning: session.warning,
    agentMode,
    changedSlots,
  };
}
