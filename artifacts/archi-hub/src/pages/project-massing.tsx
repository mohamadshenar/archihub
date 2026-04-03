import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "wouter";
import { useGetProject } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Compass, Maximize, CheckCircle2, Loader2, X, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MassingOption {
  key: string;
  title: string;
  formType: string;
  description: string;
  gfa: number;
  floors: number;
  siteCoverage: number;
  height: number;
  far: number;
  setbackFront?: number;
  setbackSide?: number;
  pros?: string[];
  cons?: string[];
}

const FORM_FALLBACKS = [
  { key: "A", title: "Vertical Tower",   formType: "tower",       siteCoverage: 35, setbackFront: 6, setbackSide: 4, pros: ["Minimal ground coverage", "Maximum views", "Efficient floor plate"], cons: ["Requires structural core", "Higher wind loads"] },
  { key: "B", title: "Podium + Tower",   formType: "podium-tower",siteCoverage: 58, setbackFront: 3, setbackSide: 3, pros: ["Active street edge", "Flexible program split"], cons: ["Complex structure at podium"] },
  { key: "C", title: "Courtyard Bar",    formType: "courtyard",   siteCoverage: 72, setbackFront: 5, setbackSide: 6, pros: ["Excellent daylighting", "Protected outdoor space"], cons: ["Largest footprint"] },
];

interface FloorGroup { functionName: string; areaPerFloor: number; floorRange: string; }

function parseFloorCount(range: string): number {
  if (!range?.includes("-")) return 1;
  const parseNum = (s: string) => {
    s = s.trim().toUpperCase();
    if (s === "G") return 0;
    if (s.startsWith("B")) return -(parseInt(s.slice(1)) || 1);
    return parseInt(s) || 0;
  };
  const parts = range.split("-");
  return Math.abs(parseNum(parts[1]) - parseNum(parts[0])) + 1;
}

function buildFallbackOptions(gfa: number, floors: number): MassingOption[] {
  const height = Math.round(floors * 3.5);
  return FORM_FALLBACKS.map(f => ({
    ...f,
    description: f.title === "Vertical Tower"
      ? "A slender form maximises views and minimises site footprint."
      : f.title === "Podium + Tower"
      ? "A broad podium anchors public uses at grade with an upper volume above."
      : "Two bars frame a central courtyard creating a human-scale public realm.",
    gfa, floors, height,
    far: parseFloat((floors * (f.siteCoverage / 100)).toFixed(1)),
  }));
}

// ─── Dynamic SVG Massing Diagram ─────────────────────────────────────────────
// Elevation view — width driven by siteCoverage, height driven by floors

function DynamicMassingDiagram({ formType, floors, siteCoverage, isSelected }: {
  formType: string; floors: number; siteCoverage: number; isSelected: boolean;
}) {
  const fill    = isSelected ? "rgba(245,158,11,0.28)" : "rgba(100,116,139,0.13)";
  const stroke  = isSelected ? "#f59e0b" : "#64748b";
  const fillAlt = isSelected ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.07)";
  const sw      = isSelected ? 1.5 : 1;

  const coverage = Math.min(0.82, Math.max(0.22, siteCoverage / 100));
  const hRatio   = Math.min(0.9,  Math.max(0.12, floors / 45));

  const VW = 200, VH = 185;
  const ground = VH - 18;
  const maxW = 155, maxH = 138;
  const W = Math.round(maxW * coverage);
  const H = Math.round(maxH * hRatio);
  const cx = VW / 2;
  const x0 = cx - W / 2;   // left edge
  const y0 = ground - H;   // top of building

  // Perspective tick lines at top
  const pers = (x: number, y: number) => (
    <>
      <line x1={x} y1={y} x2={x + 18} y2={y - 10} stroke={stroke} strokeWidth={0.6} strokeOpacity={0.4} />
      <line x1={x + W} y1={y} x2={x + W + 18} y2={y - 10} stroke={stroke} strokeWidth={0.6} strokeOpacity={0.4} />
      <line x1={x + 18} y1={y - 10} x2={x + W + 18} y2={y - 10} stroke={stroke} strokeWidth={0.6} strokeOpacity={0.4} />
    </>
  );

  // Ground shadow
  const shadow = <ellipse cx={cx} cy={ground + 5} rx={W * 0.52} ry={4} fill={stroke} fillOpacity={0.12} />;

  // Ground line
  const groundLine = <line x1={20} y1={ground} x2={VW - 20} y2={ground} stroke={stroke} strokeOpacity={0.2} strokeWidth={0.8} />;

  const rect = (x: number, y: number, w: number, h: number, altFill = false) => (
    <rect x={x} y={y} width={w} height={h} fill={altFill ? fillAlt : fill} stroke={stroke} strokeWidth={sw} rx={1} />
  );

  let shape: JSX.Element;

  switch (formType) {
    case "tower": {
      const tW = Math.max(28, W * 0.38);
      const tx = cx - tW / 2;
      shape = <>{rect(tx, y0, tW, H)}{pers(tx, y0)}</>;
      break;
    }
    case "podium-tower": {
      const podH = Math.round(H * 0.28);
      const towH = H - podH;
      const tW   = Math.max(24, W * 0.4);
      const tx   = cx - tW / 2;
      shape = <>{rect(x0, ground - podH, W, podH)}{rect(tx, y0, tW, towH)}{pers(tx, y0)}</>;
      break;
    }
    case "courtyard": {
      const barW = Math.round(W * 0.38);
      const barH = Math.round(H * 0.72);
      const capH = Math.round(H * 0.22);
      shape = (
        <>
          {rect(x0, ground - barH, barW, barH)}
          {rect(x0 + W - barW, ground - barH, barW, barH)}
          {rect(x0, ground - barH - capH, W, capH)}
          {pers(x0, ground - barH - capH)}
          <line x1={x0 + barW} y1={ground - barH} x2={x0 + W - barW} y2={ground - barH} stroke={stroke} strokeWidth={0.5} strokeOpacity={0.25} strokeDasharray="4 3" />
        </>
      );
      break;
    }
    case "bar": {
      const barH = Math.max(20, Math.round(H * 0.36));
      shape = <>{rect(x0, ground - barH, W, barH)}{pers(x0, ground - barH)}</>;
      break;
    }
    case "stepped": {
      const steps = 4;
      const stepH = Math.round(H / steps);
      shape = (
        <>
          {Array.from({ length: steps }, (_, i) => {
            const shrink = i * (W * 0.14);
            const sw2 = W - shrink;
            const sx = cx - sw2 / 2;
            return <rect key={i} x={sx} y={ground - (steps - i) * stepH} width={sw2} height={stepH} fill={i > 0 ? fillAlt : fill} stroke={stroke} strokeWidth={sw} rx={1} />;
          })}
          {pers(cx - W * 0.15, y0)}
        </>
      );
      break;
    }
    case "split": {
      const tW = Math.max(22, Math.round(W * 0.38));
      const aH = H;
      const bH = Math.round(H * 0.76);
      shape = (
        <>
          {rect(x0, ground - aH, tW, aH)}
          {rect(x0 + W - tW, ground - bH, tW, bH)}
          {pers(x0, ground - aH)}
          <line x1={x0 + tW} y1={ground - Math.round(H * 0.5)} x2={x0 + W - tW} y2={ground - Math.round(bH * 0.5)} stroke={stroke} strokeWidth={0.5} strokeOpacity={0.2} strokeDasharray="4 3" />
        </>
      );
      break;
    }
    case "L-shape": {
      const lW = Math.round(W * 0.42);
      shape = (
        <>
          {rect(x0, y0, lW, H)}
          {rect(x0, ground - Math.round(H * 0.3), W, Math.round(H * 0.3))}
          {pers(x0, y0)}
        </>
      );
      break;
    }
    case "U-shape": {
      const armW = Math.round(W * 0.28);
      const capH = Math.round(H * 0.26);
      shape = (
        <>
          {rect(x0, y0, armW, H)}
          {rect(x0 + W - armW, y0, armW, H)}
          {rect(x0, y0, W, capH, true)}
          {pers(x0, y0)}
        </>
      );
      break;
    }
    case "wrapped": {
      const outerH = H;
      const coreW = Math.round(W * 0.36);
      const coreH = Math.round(H * 0.65);
      shape = (
        <>
          {rect(x0, ground - outerH, W, Math.round(outerH * 0.18))}
          {rect(x0, y0, Math.round(W * 0.18), outerH)}
          {rect(x0 + W - Math.round(W * 0.18), y0, Math.round(W * 0.18), outerH)}
          {rect(cx - coreW / 2, ground - coreH, coreW, coreH)}
          {pers(cx - coreW / 2, ground - coreH)}
        </>
      );
      break;
    }
    case "fragmented": {
      const pieces = [
        { x: x0,                            y: ground - H,                w: Math.round(W * 0.3), h: H },
        { x: x0 + Math.round(W * 0.38),    y: ground - Math.round(H * 0.72), w: Math.round(W * 0.28), h: Math.round(H * 0.72) },
        { x: x0 + Math.round(W * 0.72),    y: ground - Math.round(H * 0.5),  w: Math.round(W * 0.28), h: Math.round(H * 0.5) },
      ];
      shape = <>{pieces.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={i > 0 ? fillAlt : fill} stroke={stroke} strokeWidth={sw} rx={1} />)}{pers(x0, ground - H)}</>;
      break;
    }
    default: {
      shape = <>{rect(x0, y0, W, H)}{pers(x0, y0)}</>;
    }
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full">
      {groundLine}
      {shadow}
      {shape}
    </svg>
  );
}

// ─── Compare metric row helper ────────────────────────────────────────────────

function MetricRow({ label, values, unit = "", higherIsBetter }: {
  label: string; values: number[]; unit?: string; higherIsBetter?: boolean;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return (
    <tr className="border-b border-border/30">
      <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground whitespace-nowrap">{label}</td>
      {values.map((v, i) => {
        const isBest = higherIsBetter ? v === max : v === min;
        const isWorst = higherIsBetter ? v === min : v === max;
        return (
          <td key={i} className="py-2.5 px-3 text-center">
            <span className={`text-sm font-mono font-medium ${isBest ? "text-emerald-400" : isWorst ? "text-rose-400" : "text-foreground"}`}>
              {v.toLocaleString()}{unit}
            </span>
            {isBest && <TrendingUp className="w-3 h-3 inline ml-1 text-emerald-400" />}
          </td>
        );
      })}
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectMassing() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const { data: project } = useGetProject(projectId);

  const [savedOptions, setSavedOptions] = useState<MassingOption[] | null>(null);
  const [selectedKey, setSelectedKey]   = useState("A");
  const [generating, setGenerating]     = useState(false);
  const [compareOpen, setCompareOpen]   = useState(false);
  const [metaLoaded, setMetaLoaded]     = useState(false);

  // Compute real values from project data
  const { actualGFA, actualFloors, actualHeight } = useMemo(() => {
    const prog = project?.program as Record<string, unknown> | null | undefined;
    const floorRows = (prog?.floors as FloorGroup[] | undefined) ?? [];
    const gfa = Math.round(
      floorRows.reduce((s, f) => s + (f.areaPerFloor ?? 0) * parseFloorCount(f.floorRange), 0)
    ) || 0;
    const numFloors = (project as Record<string, unknown> | undefined)?.numFloors as number | null ?? null;
    const fl = numFloors ?? (gfa > 0 ? Math.max(2, Math.round(gfa / 800)) : 0);
    return { actualGFA: gfa, actualFloors: fl, actualHeight: Math.round(fl * 3.5) };
  }, [project]);

  // Derived options: saved AI options take priority; fallback computed from real project data
  const options: MassingOption[] = useMemo(() => {
    if (savedOptions) return savedOptions;
    if (actualGFA > 0 && actualFloors > 0) return buildFallbackOptions(actualGFA, actualFloors);
    return buildFallbackOptions(5000, 10); // last-resort placeholder
  }, [savedOptions, actualGFA, actualFloors]);

  const loadMeta = useCallback(() => {
    if (!projectId) return;
    fetch(`${BASE}/api/projects/${projectId}/metadata`)
      .then(r => r.json())
      .then((meta: Record<string, unknown>) => {
        if (Array.isArray(meta.massingOptions) && meta.massingOptions.length > 0) {
          setSavedOptions(meta.massingOptions as MassingOption[]);
          setSelectedKey((meta.massingOptions[0] as MassingOption).key);
        }
      })
      .finally(() => setMetaLoaded(true));
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  // Reset selected key when options change
  useEffect(() => { if (options.length > 0) setSelectedKey(options[0].key); }, [options]);

  const handleGenerateIterations = async () => {
    setGenerating(true);
    try {
      // Read selected concept from concept studio (saved in localStorage)
      const storedIdx = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
      const conceptIdx = storedIdx !== null ? parseInt(storedIdx) : 0;

      const res = await fetch(`${BASE}/api/projects/${projectId}/massing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptIdx }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { options: MassingOption[] };
      if (data.options?.length) {
        setSavedOptions(data.options);
        setSelectedKey(data.options[0].key);
        setCompareOpen(false);
        toast({ title: "Massing Iterations Generated", description: `${data.options.length} new forms · GFA: ${data.options[0].gfa.toLocaleString()} m² · ${data.options[0].floors} floors.` });
      }
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate massing options.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    const opt = options.find(o => o.key === key);
    if (opt) toast({ title: `Option ${key} Selected`, description: `${opt.title} · ${opt.gfa.toLocaleString()} m² GFA · ${opt.floors} floors · ${opt.height}m height.` });
  };

  const selected = options.find(o => o.key === selectedKey) ?? options[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Massing Generator</h1>
          <p className="text-sm text-muted-foreground font-mono">Volumetric exploration and FAR optimisation.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCompareOpen(v => !v)}
            className={compareOpen ? "border-primary/60 text-primary" : ""}
          >
            <Maximize className="w-4 h-4 mr-2" />
            Compare Data
          </Button>
          <Button onClick={handleGenerateIterations} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Box className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate Iterations"}
          </Button>
        </div>
      </div>

      {/* Compare Panel */}
      <AnimatePresence>
        {compareOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-card/60">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Metric Comparison</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Green = best value · Red = worst value</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setCompareOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-xs font-mono text-muted-foreground w-36">Metric</th>
                      {options.map(o => (
                        <th key={o.key} className={`py-2 px-3 text-center ${selectedKey === o.key ? "text-primary" : ""}`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-mono text-muted-foreground">Option {o.key}</span>
                            <span className="text-sm font-semibold">{o.title}</span>
                            {selectedKey === o.key && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <MetricRow label="GFA" values={options.map(o => o.gfa)} unit=" m²" higherIsBetter />
                    <MetricRow label="Floors" values={options.map(o => o.floors)} higherIsBetter />
                    <MetricRow label="Site Coverage" values={options.map(o => o.siteCoverage)} unit="%" higherIsBetter={false} />
                    <MetricRow label="Height" values={options.map(o => o.height)} unit="m" />
                    <MetricRow label="FAR" values={options.map(o => o.far)} higherIsBetter />
                    {options.some(o => o.setbackFront != null) && (
                      <MetricRow label="Front Setback" values={options.map(o => o.setbackFront ?? 0)} unit="m" higherIsBetter={false} />
                    )}
                    {options.some(o => o.setbackSide != null) && (
                      <MetricRow label="Side Setback" values={options.map(o => o.setbackSide ?? 0)} unit="m" higherIsBetter={false} />
                    )}
                    <tr className="border-b border-border/30">
                      <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">Form Type</td>
                      {options.map(o => (
                        <td key={o.key} className="py-2.5 px-3 text-center">
                          <Badge variant="outline" className="text-[10px] font-mono">{o.formType}</Badge>
                        </td>
                      ))}
                    </tr>
                    {options.some(o => o.pros?.length) && (
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground align-top pt-3">Pros</td>
                        {options.map(o => (
                          <td key={o.key} className="py-2.5 px-3 align-top">
                            <ul className="space-y-1">
                              {(o.pros ?? []).map((p, i) => (
                                <li key={i} className="text-xs text-emerald-400 flex items-start gap-1">
                                  <TrendingUp className="w-3 h-3 shrink-0 mt-0.5" />{p}
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                    )}
                    {options.some(o => o.cons?.length) && (
                      <tr>
                        <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground align-top pt-3">Cons</td>
                        {options.map(o => (
                          <td key={o.key} className="py-2.5 px-3 align-top">
                            <ul className="space-y-1">
                              {(o.cons ?? []).map((c, i) => (
                                <li key={i} className="text-xs text-rose-400 flex items-start gap-1">
                                  <TrendingDown className="w-3 h-3 shrink-0 mt-0.5" />{c}
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Select</td>
                      {options.map(o => (
                        <td key={o.key} className="py-3 px-3 text-center">
                          <Button
                            size="sm"
                            variant={selectedKey === o.key ? "default" : "outline"}
                            onClick={() => handleSelect(o.key)}
                          >
                            {selectedKey === o.key ? "✓ Active" : "Use This"}
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Environment card */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4" /> Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
            <div className="relative w-32 h-32 rounded-full border-2 border-border flex items-center justify-center">
              {["N","S","W","E"].map((d, i) => (
                <span key={d} className="absolute text-xs font-mono font-bold text-muted-foreground"
                  style={{ top: i===0?"4px":undefined, bottom: i===1?"4px":undefined, left: i===2?"4px":undefined, right: i===3?"4px":undefined }}>
                  {d}
                </span>
              ))}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 0 1 80 80" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="80" cy="80" r="4" className="fill-primary" />
                <circle cx="20" cy="80" r="4" className="fill-primary opacity-50" />
              </svg>
              <div className="w-8 h-8 bg-muted border-2 border-primary rotate-45" />
            </div>
            <p className="text-xs text-muted-foreground text-center">Optimal orientation: 15° East of South for solar gain.</p>

            {selected && (
              <div className="w-full border-t border-border/50 pt-4 space-y-2">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Selected</p>
                <p className="text-sm font-semibold">{selected.title}</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs font-mono">
                  <span className="text-muted-foreground">GFA</span>
                  <span>{selected.gfa.toLocaleString()} m²</span>
                  <span className="text-muted-foreground">Floors</span>
                  <span>{selected.floors}</span>
                  <span className="text-muted-foreground">FAR</span>
                  <span>{selected.far}</span>
                  <span className="text-muted-foreground">Height</span>
                  <span>{selected.height}m</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Option cards */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          {options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            return (
              <motion.div key={opt.key} animate={{ scale: isSelected ? 1 : 0.97 }} transition={{ duration: 0.15 }}>
                <Card
                  className={`flex flex-col cursor-pointer transition-all h-full ${
                    isSelected ? "border-primary shadow-lg shadow-primary/10 bg-primary/5" : "hover:border-primary/50"
                  }`}
                  onClick={() => handleSelect(opt.key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant={isSelected ? "default" : "outline"} className="font-mono">Option {opt.key}</Badge>
                      {isSelected && <span className="text-xs font-mono text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SELECTED</span>}
                    </div>
                    <p className="text-base font-semibold mt-1">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Diagram */}
                    <div className="h-44 bg-black/20 border-y border-border/30 overflow-hidden">
                      <DynamicMassingDiagram
                        formType={opt.formType}
                        floors={opt.floors}
                        siteCoverage={opt.siteCoverage}
                        isSelected={isSelected}
                      />
                    </div>

                    {/* Metrics */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                        {[
                          ["GFA", `${opt.gfa.toLocaleString()} m²`],
                          ["Floors", `${opt.floors}`],
                          ["Coverage", `${opt.siteCoverage}%`],
                          ["Height", `${opt.height}m`],
                          ["FAR", `${opt.far}`],
                          ["Form", opt.formType],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <span className="block text-[10px] text-muted-foreground uppercase">{k}</span>
                            <span className="capitalize">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Coverage bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                          <span>Site Coverage</span>
                          <span>{opt.siteCoverage}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${opt.siteCoverage}%` }} />
                        </div>
                      </div>

                      {/* FAR bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                          <span>FAR</span>
                          <span>{opt.far}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(opt.far / 5 * 100, 100)}%` }} />
                        </div>
                      </div>

                      <Button
                        className="w-full mt-2"
                        variant={isSelected ? "default" : "outline"}
                        onClick={e => { e.stopPropagation(); handleSelect(opt.key); }}
                      >
                        {isSelected ? "✓ Selected" : "Select Option"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
