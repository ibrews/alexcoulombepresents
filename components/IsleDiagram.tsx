"use client";

import { useMemo, useState } from "react";
import type { IsleDiagramEdge, IsleDiagramNode } from "@/lib/isle";

type PositionedNode = IsleDiagramNode & { x: number; y: number };

const NODE_WIDTH = 190;
const NODE_HEIGHT = 64;
const LAYER_GAP = 110;
const ROW_GAP = 46;

function layoutNodes(nodes: IsleDiagramNode[], edges: IsleDiagramEdge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const connectedEdges = edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, 0);
  }
  for (const edge of connectedEdges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }

  const layers = new Map<string, number>();
  if (connectedEdges.length === 0) {
    nodes.forEach((node, index) => layers.set(node.id, index));
  } else {
    const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
    if (queue.length === 0 && nodes[0]) queue.push(nodes[0].id);

    for (let index = 0; index < queue.length; index += 1) {
      const nodeId = queue[index];
      const layer = layers.get(nodeId) ?? 0;
      layers.set(nodeId, layer);
      for (const nextId of outgoing.get(nodeId) ?? []) {
        if (!layers.has(nextId)) {
          layers.set(nextId, layer + 1);
          queue.push(nextId);
        }
      }
    }

    for (const node of nodes) {
      if (layers.has(node.id)) continue;

      const startLayer = Math.max(0, ...layers.values()) + 1;
      const unconnectedQueue = [node.id];
      layers.set(node.id, startLayer);
      for (let index = 0; index < unconnectedQueue.length; index += 1) {
        const nodeId = unconnectedQueue[index];
        const layer = layers.get(nodeId) ?? startLayer;
        for (const nextId of outgoing.get(nodeId) ?? []) {
          if (!layers.has(nextId)) {
            layers.set(nextId, layer + 1);
            unconnectedQueue.push(nextId);
          }
        }
      }
    }
  }

  const grouped = new Map<number, IsleDiagramNode[]>();
  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    grouped.set(layer, [...(grouped.get(layer) ?? []), node]);
  }

  const maxLayer = Math.max(0, ...grouped.keys());
  const maxRows = Math.max(1, ...[...grouped.values()].map((layer) => layer.length));
  const positioned = new Map<string, PositionedNode>();
  for (const [layer, layerNodes] of grouped) {
    const startY = 28 + ((maxRows - layerNodes.length) * (NODE_HEIGHT + ROW_GAP)) / 2;
    layerNodes.forEach((node, index) => {
      positioned.set(node.id, {
        ...node,
        x: 28 + layer * (NODE_WIDTH + LAYER_GAP),
        y: startY + index * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  return {
    nodes: [...positioned.values()],
    edges: connectedEdges,
    width: 56 + (maxLayer + 1) * NODE_WIDTH + maxLayer * LAYER_GAP,
    height: 56 + maxRows * NODE_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP,
  };
}

export default function IsleDiagram({
  nodes,
  edges,
}: {
  nodes: IsleDiagramNode[];
  edges: IsleDiagramEdge[];
}) {
  const diagram = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const activeNode = selectedNode ?? hoveredNode;
  const connectedNodeIds = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(
      diagram.edges.flatMap((edge) =>
        edge.from === activeNode ? [activeNode, edge.to] : edge.to === activeNode ? [activeNode, edge.from] : []
      )
    );
  }, [activeNode, diagram.edges]);

  if (diagram.nodes.length === 0) return null;

  return (
    <div className="mt-7 overflow-x-auto rounded-2xl border border-line bg-ink/30 p-3">
      <svg
        className="min-w-[36rem] text-snow"
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="img"
        aria-label="Interactive Isle flow diagram"
        onMouseLeave={() => setHoveredNode(null)}
      >
        <defs>
          <marker id="isle-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
          </marker>
        </defs>

        {diagram.edges.map((edge, index) => {
          const from = diagram.nodes.find((node) => node.id === edge.from);
          const to = diagram.nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;
          const isConnected = !activeNode || edge.from === activeNode || edge.to === activeNode;
          const x1 = from.x + (to.x >= from.x ? NODE_WIDTH : 0);
          const x2 = to.x + (to.x >= from.x ? 0 : NODE_WIDTH);
          const y1 = from.y + NODE_HEIGHT / 2;
          const y2 = to.y + NODE_HEIGHT / 2;
          const labelX = (x1 + x2) / 2;
          const labelY = (y1 + y2) / 2 - 8;

          return (
            <g key={`${edge.from}-${edge.to}-${index}`} className={isConnected ? "opacity-100" : "opacity-20"}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="text-teal/70 transition-opacity"
                stroke="currentColor"
                strokeWidth="2"
                markerEnd="url(#isle-arrow)"
              />
              {edge.label ? (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-mist font-mono text-[10px]"
                >
                  {edge.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {diagram.nodes.map((node) => {
          const isActive = node.id === activeNode;
          const isConnected = !activeNode || connectedNodeIds.has(node.id);
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectedNode === node.id}
              className={`cursor-pointer outline-none transition-opacity ${isConnected ? "opacity-100" : "opacity-20"}`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onClick={() => setSelectedNode((current) => (current === node.id ? null : node.id))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedNode((current) => (current === node.id ? null : node.id));
                }
              }}
            >
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="16"
                className={isActive ? "fill-teal/20 stroke-teal" : "fill-white/5 stroke-line"}
                strokeWidth={isActive ? "2" : "1"}
              />
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + NODE_HEIGHT / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-snow font-mono text-[12px]"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center font-mono text-[10px] text-mist">
        Hover to trace a connection. Click a node to keep it highlighted.
      </p>
    </div>
  );
}
