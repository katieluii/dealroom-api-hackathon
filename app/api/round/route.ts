import { NextResponse } from "next/server";
import {
  createSession,
  getSession,
  createDefaultSession,
  response,
  revise,
} from "@/lib/session";
import { parseConstraints } from "@/lib/agent-tools";
import type { SlotName } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object")
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const existing = getSession(
      typeof body.sessionId === "string" ? body.sessionId : undefined,
    );
    if (body.swap) {
      if (body.sessionId && !existing)
        return NextResponse.json(
          { error: "Session expired. Load the company again." },
          { status: 410 },
        );
      const session = existing ?? createDefaultSession();
      if (session.busy)
        return NextResponse.json(
          { error: "The round is being updated. Try again shortly." },
          { status: 409 },
        );
      const before = session.round;
      const constraints = parseConstraints({
        forceSlot: { [body.swap.slot]: body.swap.investorId },
      });
      revise(session, {
        ...session.round.constraints,
        forceSlot: {
          ...session.round.constraints.forceSlot,
          ...constraints.forceSlot,
        },
      });
      const changed = session.round.slots.find(
        (s) => s.slot === (body.swap.slot as SlotName),
      );
      return NextResponse.json(
        response(
          session,
          `${changed?.investor.name} selected as ${body.swap.slot}.`,
          before,
          process.env.ANTHROPIC_API_KEY ? "claude" : "scripted",
        ),
      );
    }
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length > 500)
      return NextResponse.json(
        { error: "Use a company name or a short Dealroom URL." },
        { status: 400 },
      );
    const session = await createSession(query, body.demo === true);
    return NextResponse.json(
      response(
        session,
        `${session.round.company.name}: ${session.round.slots.length} investors selected.`,
        undefined,
        process.env.ANTHROPIC_API_KEY ? "claude" : "scripted",
      ),
    );
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Unable to build round. Try the demo company.",
      },
      { status: 400 },
    );
  }
}
