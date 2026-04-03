import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useGetProject } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GitMerge, LayoutDashboard, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type ZoneType = "public" | "semi-public" | "private" | "service";

const ZONE_META: Record<ZoneType, { label: string; stroke: string; fill: string; dot: string; desc: string; solid: string }> = {
  "public":      { label: "Public Zone",       stroke: "#3b82f6", fill: "rgba(59,130,246,0.25)",   dot: "bg-blue-500/80 border-blue-500",    desc: "High traffic, unrestricted access. Lobbies, galleries.",    solid: "#2563eb" },
  "semi-public": { label: "Semi-Public Buffer", stroke: "#f59e0b", fill: "rgba(245,158,11,0.22)",   dot: "bg-amber-500/80 border-amber-500",  desc: "Controlled access, meeting rooms, amenity floors.",        solid: "#d97706" },
  "private":     { label: "Private Core",       stroke: "#10b981", fill: "rgba(16,185,129,0.25)",   dot: "bg-emerald-500/80 border-emerald-500", desc: "Restricted, secure. Offices, residential.",            solid: "#059669" },
  "service":     { label: "Service",            stroke: "#64748b", fill: "rgba(100,116,139,0.22)", dot: "bg-slate-500/80 border-slate-500",  desc: "MEP, loading, storage, back-of-house.",                    solid: "#475569" },
};

interface ZoningNode {
  id: string;
  zone: ZoneType;
  totalArea: number;
}

interface ZoningEdge {
  from: string;
  to: string;
  strength: "Strong" | "Medium" | "Avoid";
}

interface ZoningData {
  nodes: ZoningNode[];
  edges: ZoningEdge[];
}

interface LayoutNode extends ZoningNode {
  x: number;
  y: number;
  r: number;
  label: string;
}

interface FloorGroup {
  floorRange: string;
  functionName: string;
  areaPerFloor: number;
}

function parseFloorCount(floorRange: string): number {
  const r = (floorRange ?? "").trim().toUpperCase();
  if (!r.includes("-") && !r.includes("–")) return 1;
  const sep = r.includes("–") ? "–" : "-";
  const parts = r.split(sep);
  const parseNum = (s: string) => {
    s = s.trim();
    if (s === "G") return 0;
    if (s.startsWith("B")) return -(parseInt(s.slice(1)) || 1);
    return parseInt(s) || 0;
  };
  return Math.abs(parseNum(parts[1]) - parseNum(parts[0])) + 1;
}

function classifyZone(name: string): ZoneType {
  const n = name.toLowerCase();
  if (/park|mep|loading|plant|storag|service|mechanic|electr|util|back.of|bin|refuge|fire|generator|pump/.test(n)) return "service";
  if (/office|resid|apart|suite|hotel.room|tenant|private|penthouse|bedroom|unit|residential/.test(n)) return "private";
  if (/lobby|retail|cafe|gallery|exhibit|entrance|public|atrium|ground|reception|arrival|street|foyer|welcome|visitor|concierge|commercial/.test(n)) return "public";
  return "semi-public";
}

const MAX_DIAGRAM_NODES = 10;

function buildZoningFromProgram(floors: FloorGroup[]): ZoningData {
  const fnMap = new Map<string, { totalArea: number; zone: ZoneType }>();
  for (const f of floors) {
    const count = parseFloorCount(f.floorRange);
    const total = (f.areaPerFloor || 0) * count;
    if (fnMap.has(f.functionName)) {
      fnMap.get(f.functionName)!.totalArea += total;
    } else {
      fnMap.set(f.functionName, { totalArea: total, zone: classifyZone(f.functionName) });
    }
  }

  // Sort by area desc and cap at MAX_DIAGRAM_NODES — avoid diagram overcrowding
  let nodes: ZoningNode[] = Array.from(fnMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalArea - a.totalArea);

  if (nodes.length > MAX_DIAGRAM_NODES) {
    const top = nodes.slice(0, MAX_DIAGRAM_NODES - 1);
    // Merge the rest into a zone-grouped "Others" node per zone type present
    const rest = nodes.slice(MAX_DIAGRAM_NODES - 1);
    const restByZone = new Map<ZoneType, number>();
    for (const n of rest) restByZone.set(n.zone, (restByZone.get(n.zone) ?? 0) + n.totalArea);
    const otherNodes: ZoningNode[] = Array.from(restByZone.entries()).map(([zone, totalArea]) => ({
      id: `${zone.charAt(0).toUpperCase() + zone.slice(1)} (Others)`,
      zone,
      totalArea,
    }));
    nodes = [...top, ...otherNodes];
  }

  // Auto-generate edges based on zone relationships (only show ≤ 3 edges per node to avoid spaghetti)
  const edges: ZoningEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let strength: "Strong" | "Medium" | "Avoid" = "Medium";
      if (a.zone === b.zone) strength = "Strong";
      else if (
        (a.zone === "public" && b.zone === "semi-public") ||
        (b.zone === "public" && a.zone === "semi-public")
      ) strength = "Strong";
      else if (
        (a.zone === "service" && b.zone === "public") ||
        (b.zone === "service" && a.zone === "public") ||
        (a.zone === "service" && b.zone === "semi-public") ||
        (b.zone === "service" && a.zone === "semi-public")
      ) strength = "Avoid";
      edges.push({ from: a.id, to: b.id, strength });
    }
  }

  return { nodes, edges };
}

function formatBubbleLabel(id: string): string[] {
  const words = id.split(/[\s\-–—\/,+&(]+/).filter(Boolean).map(w => w.replace(/\)$/, ""));
  if (words.length === 1) return [words[0].toUpperCase().slice(0, 14)];
  // up to 3 words, 2 lines
  const line1 = words.slice(0, 2).join(" ").toUpperCase();
  const line2 = words.length > 2 ? words.slice(2, 4).join(" ").toUpperCase() : "";
  return line2 ? [line1, line2] : [line1];
}

const MAX_RADIAL_NODES = 12;

function radialLayout(rawNodes: ZoningNode[], edges: ZoningEdge[]): LayoutNode[] {
  if (rawNodes.length === 0) return [];
  // Cap to top N by area to keep diagram legible
  const nodes = rawNodes.length > MAX_RADIAL_NODES
    ? [...rawNodes].sort((a, b) => b.totalArea - a.totalArea).slice(0, MAX_RADIAL_NODES)
    : rawNodes;
  const maxArea = Math.max(...nodes.map(n => n.totalArea), 1);

  // Hub: prefer lobby/reception/public, otherwise largest area
  const sorted = [...nodes].sort((a, b) => b.totalArea - a.totalArea);
  const hubNode =
    sorted.find(n => /lobby|entrance|reception|public.base|national|atrium/i.test(n.id)) ??
    sorted[0];

  const periphery = nodes.filter(n => n.id !== hubNode.id);

  // Build edge strength map relative to hub
  const hubEdgeStrength = new Map<string, "Strong" | "Medium" | "Avoid">();
  for (const e of edges) {
    if (e.from === hubNode.id) hubEdgeStrength.set(e.to, e.strength);
    if (e.to === hubNode.id) hubEdgeStrength.set(e.from, e.strength);
  }

  // Inner ring: "Strong" connection to hub; outer ring: everything else
  const inner = periphery.filter(n => (hubEdgeStrength.get(n.id) ?? "Medium") === "Strong");
  const outer = periphery.filter(n => (hubEdgeStrength.get(n.id) ?? "Medium") !== "Strong");

  const CX = 390, CY = 275;
  const INNER_R = inner.length <= 4 ? 150 : 165;
  const OUTER_R = outer.length <= 4 ? 250 : 268;

  function nodeRadius(n: ZoningNode, isHub = false): number {
    const base = isHub ? 60 : 24;
    const max = isHub ? 80 : 48;
    return Math.max(base, Math.min(max, base + Math.sqrt(n.totalArea / maxArea) * (max - base)));
  }

  function placeRing(group: ZoningNode[], ringR: number, angleOffset = -Math.PI / 2): LayoutNode[] {
    return group.map((node, i) => {
      const angle = angleOffset + (i / group.length) * Math.PI * 2;
      return {
        ...node,
        x: CX + Math.cos(angle) * ringR,
        y: CY + Math.sin(angle) * ringR,
        r: nodeRadius(node),
        label: formatBubbleLabel(node.id)[0],
      };
    });
  }

  const hubLayout: LayoutNode = {
    ...hubNode,
    x: CX,
    y: CY,
    r: nodeRadius(hubNode, true),
    label: formatBubbleLabel(hubNode.id)[0],
  };

  return [
    hubLayout,
    ...placeRing(inner, INNER_R, -Math.PI / 2),
    ...placeRing(outer, OUTER_R, -Math.PI / 3),
  ];
}

// Calculate line endpoints clipped to bubble edges
function linePoints(a: LayoutNode, b: LayoutNode) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  return { x1: a.x + nx * (a.r + 2), y1: a.y + ny * (a.r + 2), x2: b.x - nx * (b.r + 2), y2: b.y - ny * (b.r + 2) };
}


export default function ProjectZoning() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const [zoning, setZoning] = useState<ZoningData | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCirculation, setShowCirculation] = useState(true);

  // Load saved zoning from metadata
  useEffect(() => {
    if (!projectId) return;
    setMetaLoading(true);
    fetch(`${BASE}/api/projects/${projectId}/metadata`)
      .then(r => r.json())
      .then((meta: Record<string, unknown>) => {
        if (meta.zoning) setZoning(meta.zoning as ZoningData);
      })
      .finally(() => setMetaLoading(false));
  }, [projectId]);

  const program = project?.program as Record<string, unknown> | null | undefined;
  const floors = (program?.floors as FloorGroup[] | undefined) ?? [];

  // Fall back to auto-generated zoning from program if no AI data yet
  const derivedZoning = useMemo<ZoningData>(() => {
    if (floors.length > 0) return buildZoningFromProgram(floors);
    return { nodes: [], edges: [] };
  }, [floors]);

  const activeZoning: ZoningData = zoning ?? derivedZoning;
  const layoutNodes_memo = useMemo(
    () => radialLayout(activeZoning.nodes, activeZoning.edges),
    [activeZoning.nodes, activeZoning.edges]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/zoning`, { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json() as ZoningData;
      setZoning(data);
      toast({ title: "Diagram Generated", description: "AI adjacency analysis complete." });
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate diagram.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const isLoading = projectLoading || metaLoading;
  const hasProgram = floors.length > 0;
  const nodes = layoutNodes_memo;

  // Adjacency matrix: get unique space names and build grid
  const spaceNames = activeZoning.nodes.map(n => n.id);
  const edgeMap = new Map<string, "Strong" | "Medium" | "Avoid">();
  for (const e of activeZoning.edges) {
    edgeMap.set(`${e.from}|${e.to}`, e.strength);
    edgeMap.set(`${e.to}|${e.from}`, e.strength);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zoning & Planning</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial organization and adjacencies.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCirculation(v => !v)}
            className={showCirculation ? "border-primary/50 text-primary" : ""}
          >
            <GitMerge className="w-4 h-4 mr-2" />
            {showCirculation ? "Hide Circulation" : "Show Circulation"}
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !hasProgram}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LayoutDashboard className="w-4 h-4 mr-2" />}
            Generate Diagram
          </Button>
        </div>
      </div>

      {!hasProgram && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No program generated yet. Generate a Program first so the diagram can reflect your actual floor functions.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Zone Legend */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Zone Taxonomy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.entries(ZONE_META) as [ZoneType, typeof ZONE_META[ZoneType]][]).map(([key, meta]) => (
              <div key={key} className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded mt-1 shrink-0 border ${meta.dot}`} />
                <div>
                  <h4 className="text-sm font-semibold">{meta.label}</h4>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
              </div>
            ))}
            {zoning && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-emerald-400 font-mono">✓ AI-generated diagram</p>
              </div>
            )}
            {!zoning && hasProgram && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-mono">Auto-derived from program. Generate Diagram for AI analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bubble Diagram */}
        <Card className="lg:col-span-3 min-h-[420px] flex flex-col bg-card/50 border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="w-64 h-64 rounded-full opacity-20" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-mono">
              No spatial data yet — generate a program first.
            </div>
          ) : (
            <svg viewBox="0 0 780 550" className="w-full h-full" style={{ minHeight: 380 }}>
              <defs>
                <filter id="hub-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="node-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {(() => {
                if (nodes.length === 0) return null;
                const hub = nodes[0]; // hub is always first
                const periphery = nodes.slice(1);

                // Build edge strength lookup
                const edgeMap = new Map<string, "Strong" | "Medium" | "Avoid">();
                for (const e of activeZoning.edges) {
                  edgeMap.set(`${e.from}|${e.to}`, e.strength);
                  edgeMap.set(`${e.to}|${e.from}`, e.strength);
                }

                return (
                  <>
                    {/* Hub-to-spoke connection lines */}
                    {showCirculation && periphery.map((node, i) => {
                      const strength = edgeMap.get(`${hub.id}|${node.id}`) ?? "Medium";
                      if (strength === "Avoid") return null;
                      const pts = linePoints(hub, node);
                      const isStrong = strength === "Strong";
                      return (
                        <line
                          key={`spoke-${i}`}
                          x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                          stroke={isStrong ? "rgba(251,191,36,0.65)" : "rgba(148,163,184,0.35)"}
                          strokeWidth={isStrong ? 2.5 : 1.2}
                          strokeDasharray={isStrong ? "none" : "6 4"}
                        />
                      );
                    })}

                    {/* Secondary connections between periphery nodes (Strong only) */}
                    {showCirculation && periphery.map((a, ai) =>
                      periphery.slice(ai + 1).map((b, _bi) => {
                        const strength = edgeMap.get(`${a.id}|${b.id}`);
                        if (strength !== "Strong") return null;
                        const pts = linePoints(a, b);
                        return (
                          <line
                            key={`cross-${ai}-${_bi}`}
                            x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                            stroke="rgba(251,191,36,0.25)"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                          />
                        );
                      })
                    )}

                    {/* Periphery nodes */}
                    {periphery.map((node) => {
                      const meta = ZONE_META[node.zone];
                      const lines = formatBubbleLabel(node.id);
                      const fs = node.r > 35 ? 10 : 8.5;
                      const lineH = fs + 2;
                      const totalH = lines.length * lineH;
                      return (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`} filter="url(#node-glow)">
                          <circle r={node.r} fill={meta.solid} stroke={meta.stroke} strokeWidth={1.5} opacity={0.9} />
                          {lines.map((line, li) => (
                            <text
                              key={li}
                              textAnchor="middle"
                              y={-totalH / 2 + li * lineH + fs * 0.8}
                              fontSize={fs}
                              fontFamily="Space Mono, monospace"
                              fontWeight="500"
                              fill="white"
                            >
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    })}

                    {/* Hub node — center, largest, on top */}
                    {(() => {
                      const meta = ZONE_META[hub.zone];
                      const lines = formatBubbleLabel(hub.id);
                      const fs = hub.r > 65 ? 12 : 10;
                      const lineH = fs + 3;
                      const totalH = lines.length * lineH;
                      return (
                        <g transform={`translate(${hub.x},${hub.y})`} filter="url(#hub-glow)">
                          <circle r={hub.r} fill={meta.solid} stroke={meta.stroke} strokeWidth={3} opacity={0.95} />
                          {/* Outer ring accent */}
                          <circle r={hub.r + 8} fill="none" stroke={meta.stroke} strokeWidth={1} opacity={0.3} strokeDasharray="4 3" />
                          {lines.map((line, li) => (
                            <text
                              key={li}
                              textAnchor="middle"
                              y={-totalH / 2 + li * lineH + fs * 0.85}
                              fontSize={fs}
                              fontFamily="Space Mono, monospace"
                              fontWeight="700"
                              fill="white"
                            >
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    })()}
                  </>
                );
              })()}
            </svg>
          )}
        </Card>
      </div>

      {/* Adjacency Matrix */}
      {spaceNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjacency Matrix</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Space</TableHead>
                  {spaceNames.map(name => (
                    <TableHead key={name} className="min-w-[100px] text-xs">
                      {name.length > 14 ? name.slice(0, 14) + "…" : name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaceNames.map(rowName => (
                  <TableRow key={rowName}>
                    <TableCell className="font-medium text-sm">{rowName}</TableCell>
                    {spaceNames.map(colName => {
                      if (rowName === colName) return <TableCell key={colName} className="bg-muted/30 text-center">—</TableCell>;
                      const strength = edgeMap.get(`${rowName}|${colName}`);
                      return (
                        <TableCell key={colName} className="text-center text-sm">
                          {strength === "Strong" && <span className="text-primary font-bold">Strong</span>}
                          {strength === "Medium" && <span className="text-muted-foreground">Medium</span>}
                          {strength === "Avoid" && <span className="text-destructive">Avoid</span>}
                          {!strength && <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Legend for circulation */}
      {showCirculation && nodes.length > 0 && (
        <div className="flex gap-6 px-1 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="rgba(251,191,36,0.7)" strokeWidth="2.5" strokeDasharray="6,3" /></svg>
            Strong adjacency
          </div>
          <div className="flex items-center gap-2">
            <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeDasharray="4,4" /></svg>
            Medium adjacency
          </div>
          <div className="flex items-center gap-2">
            <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="rgba(239,68,68,0.4)" strokeWidth="1" strokeDasharray="2,7" /></svg>
            Avoid adjacency
          </div>
        </div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
