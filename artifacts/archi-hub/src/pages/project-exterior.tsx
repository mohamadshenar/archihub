import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, CheckCircle2, Loader2, Layers, ChevronRight, Paintbrush, Palette, BookMarked } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Material { name: string; finish: string; description: string; }
interface Glazing  { type: string; tint: string; description: string; }
interface FacadeDesign {
  primaryMaterial:    Material;
  secondaryMaterial:  Material;
  glazing:            Glazing;
  wwr:                number;
  thermalPerformance: string;
  rValue:             string;
  shadingStrategy:    string;
  openingPattern:     string;
  colorPalette:       string[];
  styleDirection:     string;
  recommendations:    string[];
  northFacade:        string;
  southFacade:        string;
  eastFacade:         string;
  westFacade:         string;
  generatedAt?:       string;
  recommendationsApplied?: boolean;
  appliedAt?:         string;
}

interface BriefData {
  styles?:        string[];
  sustainability?: string[];
  mustHave?:      string;
  avoid?:         string;
  budgetPriority?: number;
}

interface ConceptData {
  title:        string;
  tags:         string[];
  palette:      string[];
  narrative:    string;
  formalStrategy?: string;
}

// Style → badge colour mapping
const STYLE_COLORS: Record<string, string> = {
  Modern:      "bg-sky-500/20 text-sky-300 border-sky-500/40",
  Minimal:     "bg-slate-500/20 text-slate-300 border-slate-500/40",
  Industrial:  "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  Organic:     "bg-green-500/20 text-green-300 border-green-500/40",
  Parametric:  "bg-violet-500/20 text-violet-300 border-violet-500/40",
  Classical:   "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Brutalist:   "bg-stone-500/20 text-stone-300 border-stone-500/40",
  Tropical:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

function materialSwatch(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("concrete")) return "#9e9e9e";
  if (n.includes("corten") || n.includes("weathered steel")) return "#8b4513";
  if (n.includes("timber") || n.includes("wood")) return "#c4a36b";
  if (n.includes("brick")) return "#b5651d";
  if (n.includes("zinc")) return "#9ab0b8";
  if (n.includes("aluminium") || n.includes("aluminum")) return "#a8a9ad";
  if (n.includes("stone") || n.includes("limestone")) return "#c8b89a";
  if (n.includes("steel")) return "#778899";
  if (n.includes("glass")) return "#93c5fd";
  return "#6b7280";
}

function MaterialCard({ mat, label }: { mat: Material; label: string }) {
  return (
    <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
      <div className="w-14 h-14 rounded shrink-0 shadow-inner" style={{ backgroundColor: materialSwatch(mat.name), opacity: 0.85 }} />
      <div>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-0.5">{label}</p>
        <h4 className="font-semibold text-sm">{mat.name}</h4>
        <p className="text-xs text-muted-foreground">{mat.finish} · {mat.description}</p>
      </div>
    </div>
  );
}

function GlazingCard({ glazing }: { glazing: Glazing }) {
  return (
    <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
      <div className="w-14 h-14 rounded shrink-0 bg-gradient-to-tr from-sky-400/30 via-slate-200/40 to-transparent border border-sky-300/30" />
      <div>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-0.5">Glazing</p>
        <h4 className="font-semibold text-sm">{glazing.type}</h4>
        <p className="text-xs text-muted-foreground">{glazing.tint} · {glazing.description}</p>
      </div>
    </div>
  );
}

export default function ProjectExterior() {
  const params    = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [facade,     setFacade]     = useState<FacadeDesign | null>(null);
  const [brief,      setBrief]      = useState<BriefData | null>(null);
  const [concept,    setConcept]    = useState<ConceptData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying,   setApplying]   = useState(false);

  const loadMeta = useCallback(async () => {
    if (!projectId) return;
    // bypass cache to always read the latest saved palette / selectedConceptIdx
    const res = await fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" });
    if (!res.ok) return;
    const meta = await res.json() as {
      exterior?:          FacadeDesign;
      brief?:             BriefData;
      concepts?:          ConceptData[];
      selectedConceptIdx?: number;
    };
    if (meta.exterior)  setFacade(meta.exterior);
    if (meta.brief)     setBrief(meta.brief);
    if (meta.concepts?.length) {
      // Prefer metadata idx → then localStorage → then 0
      const storedLocal = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
      const idx = meta.selectedConceptIdx ?? (storedLocal !== null ? parseInt(storedLocal) || 0 : 0);
      setConcept(meta.concepts[idx] ?? meta.concepts[0]);
    }
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Always pass the currently-selected concept index so the API uses the right palette
      const storedLocal = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
      const selectedConceptIdx = storedLocal !== null ? parseInt(storedLocal) || 0 : 0;

      const res = await fetch(`${BASE}/api/projects/${projectId}/exterior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedConceptIdx }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { exterior: FacadeDesign };
      setFacade(data.exterior);
      toast({ title: "Facade Design Generated", description: data.exterior.styleDirection });
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate facade design. Try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!facade) {
      toast({ title: "No Data", description: "Generate a facade design first.", variant: "destructive" });
      return;
    }
    const lines = [
      `FACADE SPECIFICATION — PROJECT ${projectId}`,
      `Generated: ${facade.generatedAt ? new Date(facade.generatedAt).toLocaleString() : "—"}`,
      ``,
      `STYLE DIRECTION`,
      facade.styleDirection,
      ``,
      `CLIENT STYLE REFERENCES`,
      `Selected: ${(brief?.styles ?? []).join(", ") || "—"}`,
      ``,
      `MATERIAL PALETTE`,
      `Primary:   ${facade.primaryMaterial?.name} — ${facade.primaryMaterial?.finish}`,
      `           ${facade.primaryMaterial?.description}`,
      `Secondary: ${facade.secondaryMaterial?.name} — ${facade.secondaryMaterial?.finish}`,
      `           ${facade.secondaryMaterial?.description}`,
      `Glazing:   ${facade.glazing?.type} (${facade.glazing?.tint})`,
      `           ${facade.glazing?.description}`,
      ``,
      `PERFORMANCE METRICS`,
      `Window-to-Wall Ratio:   ${facade.wwr ?? "—"}%`,
      `Thermal Performance:    ${facade.thermalPerformance ?? "—"}`,
      `R-Value:                ${facade.rValue ?? "—"}`,
      ``,
      `FACADE STRATEGY`,
      `Shading:         ${facade.shadingStrategy ?? "—"}`,
      `Opening Pattern: ${facade.openingPattern ?? "—"}`,
      ``,
      `ORIENTATION NOTES`,
      `North: ${facade.northFacade ?? "—"}`,
      `South: ${facade.southFacade ?? "—"}`,
      `East:  ${facade.eastFacade ?? "—"}`,
      `West:  ${facade.westFacade ?? "—"}`,
      ``,
      `RECOMMENDATIONS`,
      ...(facade.recommendations ?? []).map((r, i) => `${i + 1}. ${r}`),
      ``,
      `Recommendations Applied: ${facade.recommendationsApplied ? `Yes (${new Date(facade.appliedAt!).toLocaleString()})` : "No"}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `facade-spec-project-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Spec Exported", description: "facade-spec.txt downloaded." });
  };

  const handleApply = async () => {
    if (!facade) {
      toast({ title: "No Design", description: "Generate a facade design first.", variant: "destructive" });
      return;
    }
    if (facade.recommendationsApplied) {
      toast({ title: "Already Applied", description: "Recommendations are already integrated." });
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/exterior/apply`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { appliedAt: string };
      setFacade(prev => prev ? { ...prev, recommendationsApplied: true, appliedAt: data.appliedAt } : prev);
      toast({ title: "Recommendations Applied", description: "Facade strategies integrated into project design record." });
    } catch {
      toast({ title: "Failed", description: "Could not apply recommendations.", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const hasData      = !!facade;
  const selectedStyles = brief?.styles ?? [];
  const conceptPalette = concept?.palette ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exterior Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Facade articulation and envelope detailing.</p>
          {facade?.styleDirection && (
            <p className="text-xs text-primary/80 mt-1 font-mono">{facade.styleDirection}</p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={handleExport} disabled={!hasData}>
            <Download className="w-4 h-4 mr-2" />Export Spec
          </Button>
          <Button variant="outline" onClick={handleApply} disabled={!hasData || applying || facade?.recommendationsApplied}>
            {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {facade?.recommendationsApplied ? "Recommendations Applied" : "Apply Recommendations"}
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : hasData ? "Regenerate Facade" : "Generate Facade"}
          </Button>
        </div>
      </div>

      {/* ═══ ALWAYS-VISIBLE STYLE REFERENCE PANEL ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client style reference */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-primary" />
              Client Style Reference
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">AI will follow these</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedStyles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedStyles.map(s => (
                  <span key={s} className={`text-xs font-mono px-2 py-0.5 rounded border ${STYLE_COLORS[s] ?? "bg-muted/30 text-muted-foreground border-border/40"}`}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No styles selected in Client Brief. Go to Client Brief to set style preferences.</p>
            )}
            {brief?.mustHave && (
              <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                <span className="text-primary/70">Must have:</span> {brief.mustHave}
              </p>
            )}
            {brief?.avoid && (
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                <span className="text-red-400/70">Avoid:</span> {brief.avoid}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Concept colour palette reference */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Concept Colour Reference
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">Facade palette derived from this</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {concept ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{concept.title}</span>
                  {concept.tags?.slice(0, 3).map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 h-4">{t}</Badge>
                  ))}
                </div>
                {conceptPalette.length > 0 ? (
                  <div className="flex gap-1.5 mt-1">
                    {conceptPalette.map((hex, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-8 rounded shadow-sm border border-white/10" style={{ backgroundColor: hex }} title={hex} />
                        <span className="text-[9px] font-mono text-muted-foreground">{hex}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No palette in concept.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No concept selected. Go to Concept Studio to generate and select a design concept — its colour palette will guide the facade.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {!hasData && !generating && (
        <Card className="border-dashed border-border/50">
          <CardContent className="py-14 flex flex-col items-center gap-4 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold">No Facade Design Yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedStyles.length > 0
                  ? `Ready to generate — will follow ${selectedStyles.join(", ")} style${selectedStyles.length > 1 ? "s" : ""}.`
                  : "Set style preferences in Client Brief, then click Generate."}
              </p>
            </div>
            <Button onClick={handleGenerate} className="mt-2">
              <Building2 className="w-4 h-4 mr-2" />Generate Facade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {/* Generated facade content */}
      {hasData && !generating && facade && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Material Assembly */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-primary" />
                  Material Assembly
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facade.primaryMaterial   && <MaterialCard mat={facade.primaryMaterial}   label="Primary" />}
                {facade.secondaryMaterial && <MaterialCard mat={facade.secondaryMaterial} label="Secondary" />}
                {facade.glazing           && <GlazingCard  glazing={facade.glazing} />}
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="space-y-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Facade Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span>Window-to-Wall Ratio</span>
                      <span>{facade.wwr ?? 42}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${facade.wwr ?? 42}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span>Thermal Performance</span>
                      <span className="text-green-400">{facade.thermalPerformance ?? "Target Met"}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="text-xs font-mono">
                      <p className="text-muted-foreground">R-Value</p>
                      <p className="text-foreground font-semibold">{facade.rValue ?? "—"}</p>
                    </div>
                    <div className="text-xs font-mono">
                      <p className="text-muted-foreground">Opening Pattern</p>
                      <p className="text-foreground font-semibold leading-tight">{facade.openingPattern ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facade Colour Palette */}
              {facade.colorPalette?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Facade Colour Palette
                      {conceptPalette.length > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto">derived from concept</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Concept reference palette (small) */}
                    {conceptPalette.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-widest">Concept source palette</p>
                        <div className="flex gap-1">
                          {conceptPalette.map((hex, i) => (
                            <div key={i} className="flex-1 h-3 rounded-sm opacity-60" style={{ backgroundColor: hex }} title={hex} />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Generated facade palette */}
                    <div>
                      {conceptPalette.length > 0 && (
                        <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-widest">Applied facade palette</p>
                      )}
                      <div className="flex gap-2">
                        {facade.colorPalette.map((hex, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full h-10 rounded border border-white/10 shadow-sm" style={{ backgroundColor: hex }} />
                            <span className="text-[10px] font-mono text-muted-foreground">{hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Orientation Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Orientation Strategy</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["North", "South", "East", "West"] as const).map(dir => (
                <div key={dir} className="p-3 rounded bg-muted/20 border border-border/30">
                  <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{dir}</p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {facade[`${dir.toLowerCase()}Facade` as keyof FacadeDesign] as string ?? "—"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shading strategy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shading & Envelope Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{facade.shadingStrategy}</p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className={facade.recommendationsApplied ? "border-green-500/30 bg-green-950/10" : "border-primary/20"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <Layers className="w-4 h-4 text-primary" />
                Facade Agent Recommendations
                {facade.recommendationsApplied && (
                  <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px] ml-auto">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(facade.recommendations ?? []).map((rec, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
              {!facade.recommendationsApplied && (
                <div className="pt-2">
                  <Button size="sm" variant="secondary" onClick={handleApply} disabled={applying}>
                    {applying ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                    Apply Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
