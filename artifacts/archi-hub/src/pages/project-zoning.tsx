import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "wouter";
import { useGetProject } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GitMerge, LayoutDashboard, Loader2, AlertCircle, History, X, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type ZoneType = "public" | "semi-public" | "private" | "service";

const ZONE_META: Record<ZoneType, { label: string; stroke: string; fill: string; dot: string; desc: string; solid: string }> = {
  "public":      { label: "Public Zone",        stroke: "#3b82f6", fill: "rgba(59,130,246,0.25)",  dot: "bg-blue-500/80 border-blue-500",       desc: "High traffic, unrestricted access. Lobbies, galleries.",  solid: "#2563eb" },
  "semi-public": { label: "Semi-Public Buffer",  stroke: "#f59e0b", fill: "rgba(245,158,11,0.22)",  dot: "bg-amber-500/80 border-amber-500",      desc: "Controlled access, meeting rooms, amenity floors.",       solid: "#d97706" },
  "private":     { label: "Private Core",        stroke: "#10b981", fill: "rgba(16,185,129,0.25)",  dot: "bg-emerald-500/80 border-emerald-500",  desc: "Restricted, secure. Offices, residential.",              solid: "#059669" },
  "service":     { label: "Service",             stroke: "#64748b", fill: "rgba(100,116,139,0.22)", dot: "bg-slate-500/80 border-slate-500",      desc: "MEP, loading, storage, back-of-house.",                  solid: "#475569" },
};

interface ZoningNode { id: string; zone: ZoneType; totalArea: number; }
interface ZoningEdge { from: string; to: string; strength: "Strong" | "Medium" | "Avoid"; }
interface ZoningData  { nodes: ZoningNode[]; edges: ZoningEdge[]; }
interface HistoryEntry { id: string; generatedAt: string; data: ZoningData; }
interface LayoutNode extends ZoningNode { x: number; y: number; r: number; label: string; }
interface FloorGroup  { floorRange: string; functionName: string; areaPerFloor: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFloorCount(floorRange: string): number {
  const r = (floorRange ?? "").trim().toUpperCase();
  if (!r.includes("-") && !r.includes("–")) return 1;
  const sep = r.includes("–") ? "–" : "-";
  const parts = r.split(sep);
  const num = (s: string) => {
    s = s.trim();
    if (s === "G") return 0;
    if (s.startsWith("B")) return -(parseInt(s.slice(1)) || 1);
    return parseInt(s) || 0;
  };
  return Math.abs(num(parts[1]) - num(parts[0])) + 1;
}

function classifyZone(name: string): ZoneType {
  const n = name.toLowerCase();
  if (/park|mep|loading|plant|storag|service|mechanic|electr|util|back.of|bin|refuge|fire|generator|pump/.test(n)) return "service";
  if (/office|resid|apart|suite|hotel.room|tenant|private|penthouse|bedroom|unit|residential/.test(n)) return "private";
  if (/lobby|retail|cafe|gallery|exhibit|entrance|public|atrium|ground|reception|arrival|street|foyer|welcome|visitor|concierge|commercial/.test(n)) return "public";
  return "semi-public";
}

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
  let nodes: ZoningNode[] = Array.from(fnMap.entries())
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.totalArea - a.totalArea)
    .slice(0, 10);

  const edges: ZoningEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let strength: "Strong" | "Medium" | "Avoid" = "Medium";
      if (a.zone === b.zone) strength = "Strong";
      else if ((a.zone === "public" && b.zone === "semi-public") || (b.zone === "public" && a.zone === "semi-public")) strength = "Strong";
      else if ((a.zone === "service" && b.zone !== "service") || (b.zone === "service" && a.zone !== "service")) strength = "Avoid";
      edges.push({ from: a.id, to: b.id, strength });
    }
  }
  return { nodes, edges };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const MAX_RADIAL = 12;

function formatLabel(id: string): string {
  const words = id.split(/[\s\-–—\/,+&(]+/).filter(Boolean).map(w => w.replace(/\)$/, ""));
  return words.slice(0, 2).join(" ").toUpperCase().slice(0, 16);
}

function radialLayout(rawNodes: ZoningNode[], edges: ZoningEdge[]): LayoutNode[] {
  if (rawNodes.length === 0) return [];
  const nodes = rawNodes.length > MAX_RADIAL
    ? [...rawNodes].sort((a, b) => b.totalArea - a.totalArea).slice(0, MAX_RADIAL)
    : rawNodes;
  const maxArea = Math.max(...nodes.map(n => n.totalArea), 1);

  const sorted = [...nodes].sort((a, b) => b.totalArea - a.totalArea);
  const hubNode =
    sorted.find(n => /lobby|entrance|reception|public.base|national|atrium/i.test(n.id)) ?? sorted[0];
  const periphery = nodes.filter(n => n.id !== hubNode.id);

  const hubEdgeStr = new Map<string, "Strong" | "Medium" | "Avoid">();
  for (const e of edges) {
    if (e.from === hubNode.id) hubEdgeStr.set(e.to, e.strength);
    if (e.to === hubNode.id) hubEdgeStr.set(e.from, e.strength);
  }

  const inner = periphery.filter(n => (hubEdgeStr.get(n.id) ?? "Medium") === "Strong");
  const outer = periphery.filter(n => (hubEdgeStr.get(n.id) ?? "Medium") !== "Strong");

  const CX = 390, CY = 275;
  const INNER_R = inner.length <= 4 ? 150 : 165;
  const OUTER_R = outer.length <= 4 ? 248 : 265;

  const nodeR = (n: ZoningNode, hub = false) => {
    const base = hub ? 60 : 22, max = hub ? 80 : 46;
    return Math.max(base, Math.min(max, base + Math.sqrt(n.totalArea / maxArea) * (max - base)));
  };

  const ring = (group: ZoningNode[], ringR: number, off = -Math.PI / 2): LayoutNode[] =>
    group.map((n, i) => {
      const angle = off + (i / group.length) * Math.PI * 2;
      return { ...n, x: CX + Math.cos(angle) * ringR, y: CY + Math.sin(angle) * ringR, r: nodeR(n), label: formatLabel(n.id) };
    });

  return [
    { ...hubNode, x: CX, y: CY, r: nodeR(hubNode, true), label: formatLabel(hubNode.id) },
    ...ring(inner, INNER_R, -Math.PI / 2),
    ...ring(outer, OUTER_R, -Math.PI / 3),
  ];
}

function edgePts(a: LayoutNode, b: LayoutNode) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x1: a.x + (dx / d) * (a.r + 2), y1: a.y + (dy / d) * (a.r + 2), x2: b.x - (dx / d) * (b.r + 2), y2: b.y - (dy / d) * (b.r + 2) };
}

// ─── Mini Diagram (for history cards) ─────────────────────────────────────────

function MiniDiagram({ data }: { data: ZoningData }) {
  const nodes = useMemo(() => radialLayout(data.nodes, data.edges), [data]);
  if (nodes.length === 0) return <div className="w-full h-full bg-muted/20 rounded" />;

  const minX = Math.min(...nodes.map(n => n.x - n.r));
  const maxX = Math.max(...nodes.map(n => n.x + n.r));
  const minY = Math.min(...nodes.map(n => n.y - n.r));
  const maxY = Math.max(...nodes.map(n => n.y + n.r));
  const pad = 8;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const hub = nodes[0];
  const periphery = nodes.slice(1);
  const edgeMap = new Map<string, "Strong" | "Medium" | "Avoid">();
  for (const e of data.edges) { edgeMap.set(`${e.from}|${e.to}`, e.strength); edgeMap.set(`${e.to}|${e.from}`, e.strength); }

  return (
    <svg viewBox={vb} className="w-full h-full">
      {periphery.map((n, i) => {
        const s = edgeMap.get(`${hub.id}|${n.id}`) ?? "Medium";
        const pts = edgePts(hub, n);
        return (
          <line key={i} x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
            stroke={s === "Strong" ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.4)"}
            strokeWidth={s === "Strong" ? 1.5 : 0.8}
            strokeDasharray={s === "Strong" ? "none" : "4 3"} />
        );
      })}
      {periphery.map(n => {
        const meta = ZONE_META[n.zone];
        return <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={meta.solid} opacity={0.85} />;
      })}
      <circle cx={hub.x} cy={hub.y} r={hub.r} fill={ZONE_META[hub.zone].solid} opacity={0.95} />
      <circle cx={hub.x} cy={hub.y} r={hub.r + 6} fill="none" stroke={ZONE_META[hub.zone].stroke} strokeWidth={0.8} opacity={0.4} strokeDasharray="3 2" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectZoning() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const [zoning, setZoning]               = useState<ZoningData | null>(null);
  const [zoningHistory, setZoningHistory] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [metaLoading, setMetaLoading]     = useState(true);
  const [generating, setGenerating]       = useState(false);
  const [showCirculation, setShowCirculation] = useState(true);
  const [historyOpen, setHistoryOpen]     = useState(false);

  const loadMeta = useCallback(() => {
    if (!projectId) return;
    fetch(`${BASE}/api/projects/${projectId}/metadata`)
      .then(r => r.json())
      .then((meta: Record<string, unknown>) => {
        const history = (meta.zoningHistory as HistoryEntry[] | undefined) ?? [];
        if (meta.zoning) {
          // Migrate: if there's a saved zoning but no history yet, create a synthetic entry
          if (history.length === 0) {
            const synthetic: HistoryEntry = { id: "v0", generatedAt: new Date().toISOString(), data: meta.zoning as ZoningData };
            setZoningHistory([synthetic]);
            setActiveId("v0");
          } else {
            setZoningHistory(history);
            setActiveId(history[0].id);
          }
          setZoning(meta.zoning as ZoningData);
        } else {
          setZoningHistory(history);
        }
      })
      .finally(() => setMetaLoading(false));
  }, [projectId]);

  useEffect(() => { setMetaLoading(true); loadMeta(); }, [loadMeta]);

  const program = project?.program as Record<string, unknown> | null | undefined;
  const floors  = (program?.floors as FloorGroup[] | undefined) ?? [];

  const derivedZoning = useMemo<ZoningData>(() => {
    return floors.length > 0 ? buildZoningFromProgram(floors) : { nodes: [], edges: [] };
  }, [floors]);

  const activeZoning: ZoningData = zoning ?? derivedZoning;
  const layoutNodes = useMemo(() => radialLayout(activeZoning.nodes, activeZoning.edges), [activeZoning]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/zoning`, { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const raw = await res.json() as ZoningData & { _entry?: HistoryEntry };
      const entry = raw._entry;
      const newData: ZoningData = { nodes: raw.nodes, edges: raw.edges };
      setZoning(newData);
      if (entry) {
        setZoningHistory(prev => [entry, ...prev].slice(0, 10));
        setActiveId(entry.id);
      }
      toast({ title: "New Diagram Generated", description: `${newData.nodes.length} spaces analysed by AI.` });
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate diagram.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleUseHistory = (entry: HistoryEntry) => {
    setZoning(entry.data);
    setActiveId(entry.id);
    setHistoryOpen(false);
    toast({ title: "Diagram Restored", description: `Showing diagram from ${new Date(entry.generatedAt).toLocaleString()}.` });
  };

  const isLoading  = projectLoading || metaLoading;
  const hasProgram = floors.length > 0;
  const nodes      = layoutNodes;

  const spaceNames = activeZoning.nodes.map(n => n.id);
  const edgeMap    = new Map<string, "Strong" | "Medium" | "Avoid">();
  for (const e of activeZoning.edges) {
    edgeMap.set(`${e.from}|${e.to}`, e.strength);
    edgeMap.set(`${e.to}|${e.from}`, e.strength);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zoning & Planning</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial organization and adjacencies.</p>
        </div>
        <div className="flex gap-2">
          {zoningHistory.length > 0 && (
            <Button variant="outline" onClick={() => setHistoryOpen(v => !v)} className={historyOpen ? "border-primary/50 text-primary" : ""}>
              <History className="w-4 h-4 mr-2" />
              History
              <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{zoningHistory.length}</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowCirculation(v => !v)} className={showCirculation ? "border-primary/40" : ""}>
            <GitMerge className="w-4 h-4 mr-2" />
            {showCirculation ? "Hide" : "Show"} Circulation
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
          No program generated yet. Generate a Program first.
        </div>
      )}

      {/* History Panel */}
      <AnimatePresence>
        {historyOpen && zoningHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-card/60">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Diagram History</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {zoningHistory.length} version{zoningHistory.length !== 1 ? "s" : ""} — click any to use it
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setHistoryOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {zoningHistory.map((entry, idx) => {
                    const isActive = entry.id === activeId;
                    const d = new Date(entry.generatedAt);
                    return (
                      <motion.button
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => handleUseHistory(entry)}
                        className={`relative group rounded-lg border p-2 text-left transition-all ${
                          isActive
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        {/* Mini diagram preview */}
                        <div className="w-full aspect-[4/3] mb-2 rounded overflow-hidden bg-background/50">
                          <MiniDiagram data={entry.data} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {d.toLocaleDateString([], { month: "short", day: "numeric" })}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 font-mono">
                            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {entry.data.nodes.length} spaces
                          </p>
                        </div>
                        {!isActive && (
                          <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/60 transition-opacity">
                            <span className="text-xs font-mono text-primary">Use This</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Zone Legend */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Zone Taxonomy</CardTitle></CardHeader>
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
            <div className="pt-2 border-t border-border/50 space-y-1">
              {zoning ? (
                <p className="text-xs text-emerald-400 font-mono">✓ AI-generated diagram</p>
              ) : hasProgram ? (
                <p className="text-xs text-muted-foreground font-mono">Auto-derived from program.</p>
              ) : null}
              {zoningHistory.length > 0 && (
                <p className="text-xs text-muted-foreground font-mono">{zoningHistory.length} version{zoningHistory.length !== 1 ? "s" : ""} in history</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bubble Diagram */}
        <Card className="lg:col-span-3 min-h-[440px] flex flex-col bg-card/50 border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="w-48 h-48 rounded-full opacity-20" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-mono">
              No spatial data — generate a program first.
            </div>
          ) : (
            <svg viewBox={(() => {
                if (nodes.length === 0) return "0 0 780 550";
                const pad = 50;
                const minX = Math.min(...nodes.map(n => n.x - n.r)) - pad;
                const maxX = Math.max(...nodes.map(n => n.x + n.r)) + pad;
                const minY = Math.min(...nodes.map(n => n.y - n.r)) - pad;
                const maxY = Math.max(...nodes.map(n => n.y + n.r)) + pad;
                return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
              })()} className="w-full h-full" style={{ minHeight: 380 }}>
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
                const hub = nodes[0];
                const periphery = nodes.slice(1);
                const edgeLookup = new Map<string, "Strong" | "Medium" | "Avoid">();
                for (const e of activeZoning.edges) {
                  edgeLookup.set(`${e.from}|${e.to}`, e.strength);
                  edgeLookup.set(`${e.to}|${e.from}`, e.strength);
                }
                return (
                  <>
                    {/* Spoke lines hub → periphery */}
                    {showCirculation && periphery.map((node, i) => {
                      const s = edgeLookup.get(`${hub.id}|${node.id}`) ?? "Medium";
                      if (s === "Avoid") return null;
                      const pts = edgePts(hub, node);
                      return (
                        <line key={`s${i}`}
                          x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                          stroke={s === "Strong" ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.35)"}
                          strokeWidth={s === "Strong" ? 2.5 : 1.2}
                          strokeDasharray={s === "Strong" ? "none" : "7 4"} />
                      );
                    })}

                    {/* Cross links between periphery (Strong only) */}
                    {showCirculation && periphery.map((a, ai) =>
                      periphery.slice(ai + 1).map((b, bi) => {
                        const s = edgeLookup.get(`${a.id}|${b.id}`);
                        if (s !== "Strong") return null;
                        const pts = edgePts(a, b);
                        return (
                          <line key={`c${ai}${bi}`}
                            x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                            stroke="rgba(251,191,36,0.22)" strokeWidth={1.2} strokeDasharray="4 3" />
                        );
                      })
                    )}

                    {/* Periphery bubbles */}
                    {periphery.map(node => {
                      const meta = ZONE_META[node.zone];
                      const lines = [node.label];
                      const fs = node.r > 35 ? 10 : 8.5;
                      return (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`} filter="url(#node-glow)">
                          <circle r={node.r} fill={meta.solid} stroke={meta.stroke} strokeWidth={1.5} opacity={0.9} />
                          {lines.map((line, li) => (
                            <text key={li} textAnchor="middle" y={li * (fs + 2) - (lines.length - 1) * (fs + 2) / 2 + fs * 0.35}
                              fontSize={fs} fontFamily="Space Mono, monospace" fontWeight="500" fill="white">
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    })}

                    {/* Hub bubble — center, on top */}
                    {(() => {
                      const meta = ZONE_META[hub.zone];
                      const fs = hub.r > 65 ? 12 : 10;
                      return (
                        <g transform={`translate(${hub.x},${hub.y})`} filter="url(#hub-glow)">
                          <circle r={hub.r} fill={meta.solid} stroke={meta.stroke} strokeWidth={3} opacity={0.95} />
                          <circle r={hub.r + 9} fill="none" stroke={meta.stroke} strokeWidth={1} opacity={0.28} strokeDasharray="4 3" />
                          <text textAnchor="middle" y={fs * 0.4} fontSize={fs}
                            fontFamily="Space Mono, monospace" fontWeight="700" fill="white">
                            {hub.label}
                          </text>
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

      {/* Circulation Legend */}
      {showCirculation && nodes.length > 0 && (
        <div className="flex gap-6 px-1 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="rgba(251,191,36,0.7)" strokeWidth="2.5" /></svg>
            Strong connection
          </div>
          <div className="flex items-center gap-2">
            <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="rgba(148,163,184,0.5)" strokeWidth="1.2" strokeDasharray="7 4" /></svg>
            Medium connection
          </div>
        </div>
      )}

      {/* Adjacency Matrix */}
      {spaceNames.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Adjacency Matrix</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Space</TableHead>
                  {spaceNames.map(name => (
                    <TableHead key={name} className="min-w-[90px] text-xs">
                      {name.length > 12 ? name.slice(0, 12) + "…" : name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaceNames.map(row => (
                  <TableRow key={row}>
                    <TableCell className="font-medium text-sm">{row}</TableCell>
                    {spaceNames.map(col => {
                      if (row === col) return <TableCell key={col} className="bg-muted/30 text-center text-muted-foreground">—</TableCell>;
                      const s = edgeMap.get(`${row}|${col}`);
                      return (
                        <TableCell key={col} className="text-center text-sm">
                          {s === "Strong" && <span className="text-primary font-bold">Strong</span>}
                          {s === "Medium" && <span className="text-muted-foreground">Medium</span>}
                          {s === "Avoid"  && <span className="text-destructive">Avoid</span>}
                          {!s && <span className="text-muted-foreground/30">—</span>}
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

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
