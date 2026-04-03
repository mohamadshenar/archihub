import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
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

const FALLBACK_OPTIONS: MassingOption[] = [
  {
    key: "A", title: "Vertical Tower", formType: "tower",
    description: "A slender tower maximises views and minimises site footprint.",
    gfa: 4200, floors: 12, siteCoverage: 35, height: 48, far: 3.2,
    setbackFront: 6, setbackSide: 4,
    pros: ["Minimal ground coverage", "Maximum views", "Efficient floor plate"],
    cons: ["Requires structural core", "Higher wind loads"],
  },
  {
    key: "B", title: "Podium + Tower", formType: "podium-tower",
    description: "A broad podium anchors public uses at grade, with a residential tower rising above.",
    gfa: 4050, floors: 8, siteCoverage: 60, height: 32, far: 2.4,
    setbackFront: 3, setbackSide: 3,
    pros: ["Active street edge", "Flexible program split", "Strong urban presence"],
    cons: ["Complex structure at podium", "Higher cost"],
  },
  {
    key: "C", title: "Courtyard Bar", formType: "courtyard",
    description: "Two low bars frame a central courtyard, creating a human-scale public realm.",
    gfa: 4300, floors: 5, siteCoverage: 70, height: 20, far: 1.8,
    setbackFront: 5, setbackSide: 6,
    pros: ["Excellent daylighting", "Protected outdoor space", "Low visual impact"],
    cons: ["Largest footprint", "Lower FAR efficiency"],
  },
];

// ─── SVG Massing Diagrams ─────────────────────────────────────────────────────

function MassingDiagram({ formType, isSelected }: { formType: string; isSelected: boolean }) {
  const c = isSelected ? "text-primary" : "text-muted-foreground";
  const fillOp = isSelected ? "0.3" : "0.12";
  const strokeOp = isSelected ? "1" : "0.5";

  const shapes: Record<string, JSX.Element> = {
    tower: (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="80" y="30" width="40" height="140" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="72" y="150" width="56" height="20" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
        <line x1="100" y1="30" x2="130" y2="15" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1" strokeDasharray="2 2"/>
        <line x1="120" y1="30" x2="130" y2="15" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
        <line x1="130" y1="15" x2="130" y2="145" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
      </svg>
    ),
    "podium-tower": (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="40" y="130" width="120" height="40" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="75" y="50" width="50" height="80" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <line x1="100" y1="50" x2="130" y2="35" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1" strokeDasharray="2 2"/>
        <line x1="125" y1="50" x2="130" y2="35" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
        <line x1="130" y1="35" x2="130" y2="130" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
      </svg>
    ),
    courtyard: (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="60" width="60" height="100" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="110" y="60" width="60" height="100" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="40" width="140" height="20" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <line x1="87" y1="83" x2="113" y2="83" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    ),
    bar: (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="60" width="140" height="80" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <line x1="100" y1="60" x2="130" y2="45" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1" strokeDasharray="2 2"/>
        <line x1="170" y1="60" x2="130" y2="45" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
        <line x1="130" y1="45" x2="130" y2="140" stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1"/>
      </svg>
    ),
    stepped: (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="130" width="140" height="40" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="95" width="100" height="35" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="60" width="60" height="35" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="30" width="30" height="30" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
      </svg>
    ),
    "L-shape": (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="80" width="60" height="90" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="30" width="140" height="50" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
      </svg>
    ),
    "U-shape": (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="50" width="45" height="120" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="125" y="50" width="45" height="120" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="30" y="50" width="140" height="40" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
      </svg>
    ),
    split: (
      <svg viewBox="0 0 200 200" className={`w-28 h-28 ${c}`}>
        <rect x="30" y="70" width="60" height="100" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <rect x="110" y="50" width="60" height="120" fill="currentColor" fillOpacity={fillOp} stroke="currentColor" strokeOpacity={strokeOp} strokeWidth="1.5"/>
        <line x1="90" y1="120" x2="110" y2="110" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    ),
  };

  return shapes[formType] ?? shapes["bar"];
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

  const [options, setOptions]       = useState<MassingOption[]>(FALLBACK_OPTIONS);
  const [selectedKey, setSelectedKey] = useState("A");
  const [generating, setGenerating] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const loadMeta = useCallback(() => {
    if (!projectId) return;
    fetch(`${BASE}/api/projects/${projectId}/metadata`)
      .then(r => r.json())
      .then((meta: Record<string, unknown>) => {
        if (Array.isArray(meta.massingOptions) && meta.massingOptions.length > 0) {
          setOptions(meta.massingOptions as MassingOption[]);
          setSelectedKey((meta.massingOptions[0] as MassingOption).key);
        }
      });
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerateIterations = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/massing`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { options: MassingOption[] };
      if (data.options?.length) {
        setOptions(data.options);
        setSelectedKey(data.options[0].key);
        setCompareOpen(false);
        toast({ title: "Massing Iterations Generated", description: `${data.options.length} volumetric options calculated by AI.` });
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
                    <div className="h-44 bg-black/20 flex items-center justify-center border-y border-border/30">
                      <MassingDiagram formType={opt.formType} isSelected={isSelected} />
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
