"use client";
import ForceGraph2D, {
  ForceGraphMethods,
  NodeObject,
  LinkObject,
} from "react-force-graph-2d";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, GraphNode, GraphLink } from "@/lib/types";
export default function RoundGraph({
  data,
  selected,
  onSelect,
}: {
  data: GraphData;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null),
    graph = useRef<ForceGraphMethods<GraphNode, GraphLink>>();
  const [size, setSize] = useState({ width: 600, height: 380 });
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: el.clientWidth, height: el.clientHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      graph.current?.centerAt(0, 20, 0);
      graph.current?.zoom(Math.min(size.width / 590, size.height / 430), 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [size, data]);
  const paint = (
    node: NodeObject<GraphNode>,
    ctx: CanvasRenderingContext2D,
  ) => {
    const x = node.x ?? 0,
      y = node.y ?? 0,
      isCompany = node.role === "Company",
      radius = isCompany ? 37 : 30;
    const colour = isCompany
      ? "#101512"
      : node.conflict === "hard"
        ? "#c85563"
        : node.conflict === "soft"
          ? "#bf9348"
          : "#55967f";
    ctx.beginPath();
    ctx.arc(x, y, radius + 7, 0, 2 * Math.PI);
    ctx.fillStyle =
      node.id === selected ? "#f2e8c9" : isCompany ? "#f4f3ef" : "#f4f3ef";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isCompany ? "#101512" : "white";
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = node.id === selected ? 2.5 : 1.5;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isCompany ? "white" : colour;
    ctx.font = `600 ${isCompany ? 25 : 20}px "Helvetica Neue",Arial,sans-serif`;
    ctx.fillText(
      node.name
        .replace(" (mock)", "")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join(""),
      x,
      y,
    );
    ctx.fillStyle = "#101512";
    ctx.font = '500 12px "Helvetica Neue",Arial,sans-serif';
    ctx.fillText(node.name.replace(" (mock)", ""), x, y + radius + 20);
    ctx.font = '10px "Helvetica Neue",Arial,sans-serif';
    ctx.fillStyle = "#626860";
    ctx.fillText(node.role, x, y + radius + 36);
  };
  return (
    <div
      className="force-canvas"
      ref={wrapper}
      role="region"
      aria-label="Funding round graph. Select the corresponding slot card below for keyboard access."
    >
      <ForceGraph2D
        ref={graph}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="transparent"
        nodeCanvasObject={paint}
        nodePointerAreaPaint={(node, colour, ctx) => {
          ctx.fillStyle = colour;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, 42, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={(link: LinkObject<GraphNode, GraphLink>) =>
          link.kind === "chemistry" ? "#9c9169" : "#d5d7d1"
        }
        linkWidth={(link: LinkObject<GraphNode, GraphLink>) =>
          link.kind === "chemistry" ? Math.min(6, 1 + Math.sqrt(link.count)) : 1
        }
        linkLineDash={(link) => (link.kind === "round" ? [4, 5] : [])}
        linkCurvature={(link) => (link.kind === "chemistry" ? 0.17 : 0)}
        linkLabel={(link) => link.label}
        nodeLabel={(node) => node.name + " / " + node.role}
        onNodeClick={(node) => onSelect(String(node.id))}
        enableNodeDrag
        cooldownTicks={30}
        minZoom={0.5}
        maxZoom={2.5}
      />
      <div className="graph-controls">
        <button
          aria-label="Zoom graph in"
          onClick={() =>
            graph.current?.zoom((graph.current.zoom() || 1) * 1.2, 200)
          }
        >
          +
        </button>
        <button
          aria-label="Zoom graph out"
          onClick={() =>
            graph.current?.zoom((graph.current.zoom() || 1) / 1.2, 200)
          }
        >
          −
        </button>
        <button
          aria-label="Reset graph"
          onClick={() => {
            graph.current?.centerAt(0, 20, 200);
            graph.current?.zoom(
              Math.min(size.width / 590, size.height / 430),
              200,
            );
          }}
        >
          ⌖
        </button>
      </div>
    </div>
  );
}
