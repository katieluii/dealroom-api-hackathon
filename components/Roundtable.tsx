"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RoundResponse, Slot, SlotName } from "@/lib/types";
import { slotLabels } from "@/lib/graph";
import { exportPlan } from "@/lib/export";
const RoundGraph = dynamic(() => import("./RoundGraph"), {
  ssr: false,
  loading: () => <div className="graph-loading">Drawing the round…</div>,
});
const clean = (s: string) => s.replace(" (mock)", "");
interface Message {
  role: "assistant" | "user";
  text: string;
}
export default function Roundtable({ initial }: { initial: RoundResponse }) {
  const [data, setData] = useState(initial),
    [selected, setSelected] = useState<SlotName>("lead"),
    [query, setQuery] = useState(""),
    [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [messages, setMessages] = useState<Message[]>([
      {
        role: "assistant",
        text: "Compare investors, check conflicts, or change the lead.",
      },
    ]),
    [detail, setDetail] = useState<{
      slot: Slot;
      kind: "conflict" | "evidence";
    } | null>(null);
  const chatScroll = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    requestRef = useRef(false);
  useEffect(() => {
    if (chatScroll.current)
      chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
  }, [messages, busy]);
  useEffect(() => {
    if (detail) dialog.current?.showModal();
    else dialog.current?.close();
  }, [detail]);
  const lead = data.round.slots.find((s) => s.slot === "lead"),
    shared = new Set(
      data.round.slots.flatMap((s) =>
        s.chemistryWithLead.evidence.map((e) => e.roundId),
      ),
    ).size;
  async function request(
    path: string,
    body: Record<string, unknown>,
    userText?: string,
  ) {
    if (requestRef.current) return;
    requestRef.current = true;
    setBusy(true);
    setError("");
    if (userText) setMessages((m) => [...m, { role: "user", text: userText }]);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sessionId: data.sessionId }),
        signal: AbortSignal.timeout(90000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "The request could not be completed.");
      setData(result);
      if (result.message)
        setMessages((m) => [...m, { role: "assistant", text: result.message }]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Request failed. Your current round is unchanged.",
      );
    } finally {
      requestRef.current = false;
      setBusy(false);
    }
  }
  function send(text: string) {
    if (!text.trim() || busy) return;
    setPrompt("");
    void request("/api/chat", { message: text }, text);
  }
  function download() {
    const file = new Blob([exportPlan(data.round, data.mode)], {
        type: "text/markdown",
      }),
      url = URL.createObjectURL(file),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mi-chi-round-plan.md";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="shell">
      <header className="topbar">
        <a href="/" className="brand">
          mi-chi
        </a>
        <div className="header-actions">
          <span className={"mode-tag " + data.mode}>
            {data.mode === "mock"
              ? "Mock data"
              : data.mode === "cached"
                ? "Cached Dealroom data"
                : "Live Dealroom data"}
          </span>
          <button className="export-button" onClick={download}>
            Export round plan
          </button>
        </div>
      </header>
      <section className="intro-row">
        <h1>Build the next round</h1>
      </section>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void request("/api/round", { query });
        }}
      >
        <input
          aria-label="Company name or Dealroom URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a company by name or Dealroom URL"
        />
        <button className="primary-button" disabled={busy || !query.trim()}>
          Build round
        </button>
        <button
          type="button"
          className="demo-button"
          disabled={busy}
          onClick={() => void request("/api/round", { demo: true })}
        >
          Load demo company
        </button>
      </form>
      {(error || data.warning) && (
        <div className="notice" role="status">
          {error || data.warning}
          <button
            aria-label="Dismiss notice"
            onClick={() => {
              setError("");
              setData((d) => ({ ...d, warning: undefined }));
            }}
          >
            ×
          </button>
        </div>
      )}
      <main className="main-grid">
        <section className="round-workspace">
          <div className="company-row">
            <div>
              <h2>{clean(data.round.company.name)}</h2>
              <p>
                {data.round.company.stage} <span>/</span>{" "}
                {data.round.company.country} <span>/</span>{" "}
                {data.round.company.sectors.join(", ")}
              </p>
            </div>
            <span className="round-status">
              <i />
              {data.round.slots.length} / 4 investors
            </span>
          </div>
          <section className="graph-panel">
            <div className="graph-title">
              <span>Proposed round</span>
              <span>{shared} shared rounds</span>
            </div>
            <RoundGraph
              data={data.graph}
              selected={
                data.round.slots.find((s) => s.slot === selected)?.investor
                  .id ?? ""
              }
              onSelect={(id) => {
                const slot = data.round.slots.find((s) => s.investor.id === id);
                if (slot) {
                  setSelected(slot.slot);
                  document
                    .getElementById("slot-" + slot.slot)
                    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }}
            />
            <div className="graph-legend">
              <span>
                <i className="legend-dot clear" />
                Clear
              </span>
              <span>
                <i className="legend-dot soft" />
                Potential overlap
              </span>
              <span>
                <i className="legend-dot hard" />
                Hard conflict
              </span>
              <span className="legend-edges">Link width: shared rounds</span>
            </div>
          </section>
          <div className="slots-heading">
            <h3>Investors</h3>
          </div>
          <div className="slot-grid">
            {(
              ["lead", "follower1", "follower2", "strategic"] as SlotName[]
            ).map((name) => {
              const slot = data.round.slots.find((s) => s.slot === name);
              if (!slot)
                return (
                  <div className="empty-slot" key={name}>
                    <b>{slotLabels[name]}</b>
                    <p>No eligible candidate. Ask to relax the constraints.</p>
                  </div>
                );
              return (
                <article
                  id={"slot-" + name}
                  key={name}
                  className={`slot-card ${selected === name ? "selected" : ""} ${data.changedSlots.includes(name) ? "changed" : ""}`}
                >
                  <div className="slot-top">
                    <button
                      className="slot-role"
                      aria-pressed={selected === name}
                      onClick={() => setSelected(name)}
                    >
                      {slotLabels[name]}
                    </button>
                    <button
                      className={"conflict-badge " + slot.conflict.status}
                      onClick={() => setDetail({ slot, kind: "conflict" })}
                    >
                      {slot.conflict.status === "soft"
                        ? "Overlap to check"
                        : slot.conflict.status === "hard"
                          ? "Hard conflict"
                          : "No overlap found"}{" "}
                      <span>↗</span>
                    </button>
                  </div>
                  <button
                    className="investor-name"
                    onClick={() => setSelected(name)}
                  >
                    {clean(slot.investor.name)}
                  </button>
                  <div className="investor-location">
                    {slot.investor.hqCountry} <span>/</span>{" "}
                    {
                      {
                        corporate: "Corporate investor",
                        vc: "Venture capital",
                        angel: "Angel",
                        other: "Type unknown",
                      }[slot.investor.type]
                    }
                  </div>
                  <ul className="fit-reasons">
                    {slot.fit.reasons.slice(0, 2).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <button
                    className="evidence-line"
                    onClick={() => setDetail({ slot, kind: "evidence" })}
                  >
                    {name === "lead"
                      ? `${slot.leadEvidence.led} of ${slot.leadEvidence.total} rounds led${slot.leadEvidence.inferred ? " · " + slot.leadEvidence.inferred + " inferred" : ""}`
                      : `${slot.chemistryWithLead.evidence.length} co-investments with the lead`}
                    <span>↗</span>
                  </button>
                  <label className="alternatives">
                    <span>Replace with</span>
                    <select
                      aria-label={"Replace " + slotLabels[name]}
                      value=""
                      disabled={busy || !slot.alternatives.length}
                      onChange={(e) => {
                        if (e.target.value)
                          void request("/api/round", {
                            swap: { slot: name, investorId: e.target.value },
                          });
                      }}
                    >
                      <option value="">
                        {slot.alternatives.length
                          ? "Choose investor…"
                          : "None available"}
                      </option>
                      {slot.alternatives.map((i) => (
                        <option value={i.id} key={i.id}>
                          {clean(i.name)} ({i.hqCountry})
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              );
            })}
          </div>
          <p className="data-footnote">
            {data.mode === "mock"
              ? "Fictional companies and investment history."
              : "Based on loaded Dealroom records."}{" "}
            Shared investments do not confirm a warm introduction.
          </p>
        </section>
        <aside className="chat-panel">
          <div className="chat-header">
            <div>
              <h2>Refine round</h2>
            </div>
            <span className="agent-state">
              {data.agentMode === "claude" ? "Claude" : "Demo commands"}
            </span>
          </div>
          <div
            ref={chatScroll}
            className="chat-messages"
            role="log"
            aria-label="Round discussion"
          >
            {messages.map((m, i) => (
              <div key={i} className={"chat-message " + m.role}>
                <div>{m.text}</div>
              </div>
            ))}
            {busy && (
              <div className="thinking" role="status">
                <span />
                Checking evidence…
              </div>
            )}
          </div>
          <div className="chat-bottom">
            <div className="suggestions">
              <button disabled={busy} onClick={() => send("Why this lead?")}>
                Why this lead? <span>↗</span>
              </button>
              <button
                disabled={busy}
                onClick={() => send("Replace the lead with a non-US investor")}
              >
                Find a non-US lead <span>↗</span>
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  send(
                    "Who else has co-invested with " +
                      (lead?.investor.name ?? "the lead") +
                      "?",
                  )
                }
              >
                Who has invested with the lead? <span>↗</span>
              </button>
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(prompt);
              }}
            >
              <textarea
                aria-label="Ask the round agent"
                rows={2}
                placeholder="Ask about this round…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(prompt);
                  }
                }}
              />
              <div>
                <span>
                  {data.agentMode === "claude"
                    ? "Claude"
                    : "Demo: use the prompts above"}
                </span>
                <button
                  aria-label="Send message"
                  disabled={busy || !prompt.trim()}
                >
                  ↑
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>
      <dialog
        aria-labelledby="evidence-title"
        ref={dialog}
        className="evidence-dialog"
        onCancel={() => setDetail(null)}
      >
        <button
          className="dialog-close"
          aria-label="Close evidence"
          onClick={() => setDetail(null)}
        >
          ×
        </button>
        {detail && (
          <>
            <span className="dialog-eyebrow">
              {slotLabels[detail.slot.slot]} /{" "}
              {data.mode === "mock" ? "Mock evidence" : data.mode + " evidence"}
            </span>
            <h2 id="evidence-title">{clean(detail.slot.investor.name)}</h2>
            {detail.kind === "conflict" ? (
              <>
                <p>
                  Portfolio overlap:{" "}
                  <strong>{detail.slot.conflict.status}</strong>. Review the
                  companies below before approaching this investor.
                </p>
                {detail.slot.conflict.competitors.length ? (
                  detail.slot.conflict.competitors.map((c) => (
                    <div className="evidence-item" key={c.company.id}>
                      <b>{c.company.name}</b>
                      <span>Recorded investment: {c.date}</span>
                      <ul>
                        {c.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p>
                    No overlap in loaded records. Portfolio coverage may be
                    incomplete.
                  </p>
                )}
              </>
            ) : (
              <>
                <p>
                  {detail.slot.slot === "lead"
                    ? `Led ${detail.slot.leadEvidence.led} of ${detail.slot.leadEvidence.total} loaded rounds; ${detail.slot.leadEvidence.inferred} inferred from cheque size or first-listed participation. Shared history with proposed followers appears below.`
                    : `Co-invested with ${lead?.investor.name} in ${detail.slot.chemistryWithLead.evidence.length} loaded rounds.`}
                </p>
                {(detail.slot.slot === "lead"
                  ? [
                      ...new Map(
                        data.round.slots
                          .filter((s) => s.slot !== "lead")
                          .flatMap((s) => s.chemistryWithLead.evidence)
                          .map((e) => [e.roundId, e]),
                      ).values(),
                    ]
                  : detail.slot.chemistryWithLead.evidence
                ).map((e, i) => (
                  <div className="evidence-item" key={e.roundId + "-" + i}>
                    <b>{e.companyName}</b>
                    <span>
                      {e.stage} / {e.date}
                    </span>
                    <small>
                      {e.followedOn
                        ? "Later raised a follow-on round"
                        : "No later round in loaded data"}
                    </small>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
