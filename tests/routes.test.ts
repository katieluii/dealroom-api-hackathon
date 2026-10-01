import test from "node:test";
import assert from "node:assert/strict";
import { POST as chat } from "../app/api/chat/route";
import { POST as round } from "../app/api/round/route";
import { createDefaultSession } from "../lib/session";
import { exportPlan } from "../lib/export";
const request = (body: unknown) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
test("rejected concurrent chat keeps the owning request lock", async () => {
  const session = createDefaultSession();
  session.busy = true;
  const reply = await chat(
    request({ sessionId: session.id, message: "Why this lead?" }),
  );
  assert.equal(reply.status, 409);
  assert.equal(session.busy, true);
  session.busy = false;
});
test("expired supplied sessions never silently become mock rounds", async () => {
  for (const [handler, body] of [
    [chat, { message: "Why this lead?" }],
    [round, { swap: { slot: "lead", investorId: "i1" } }],
  ] as const) {
    const reply = await handler(request({ ...body, sessionId: "expired" }));
    assert.equal(reply.status, 410);
  }
});
test("corporate in lead slot is rejected without changing the round", async () => {
  const session = createDefaultSession(),
    before = session.round;
  const reply = await round(
    request({
      sessionId: session.id,
      swap: { slot: "lead", investorId: "i24" },
    }),
  );
  assert.equal(reply.status, 400);
  assert.equal(session.round, before);
  assert.equal(session.round.slots.length, 4);
});
test("scripted explanation cites evidence and non-US lead change returns matching graph", async () => {
  const old = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const session = createDefaultSession();
    const explanation = await chat(
      request({ sessionId: session.id, message: "Why this lead?" }),
    );
    const evidence = await explanation.json();
    assert.equal(explanation.status, 200);
    assert.match(evidence.message, /inferred/);
    assert.match(evidence.message, /\(mock\)/);
    const swapped = await chat(
      request({
        sessionId: session.id,
        message: "Replace the lead with a non-US investor",
      }),
    );
    const updated = await swapped.json();
    assert.equal(swapped.status, 200);
    assert.equal(updated.round.slots.length, 4);
    const lead = updated.round.slots.find(
      (s: { slot: string }) => s.slot === "lead",
    );
    assert.notEqual(lead.investor.hqCountry, "United States");
    assert.ok(
      updated.graph.nodes.some(
        (n: { id: string }) => n.id === lead.investor.id,
      ),
    );
    assert.ok(updated.changedSlots.includes("lead"));
  } finally {
    if (old === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = old;
  }
});
test("export labels mock evidence and discloses omitted conflicts", () => {
  const session = createDefaultSession();
  const plan = exportPlan(session.round, "mock");
  assert.match(plan, /MOCK DATA/);
  assert.match(plan, /more overlaps in the app/);
  assert.match(plan, /Co-investment evidence/);
  assert.match(plan, /inferred/);
});
