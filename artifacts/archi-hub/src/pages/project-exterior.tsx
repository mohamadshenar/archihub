import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, CheckCircle2, Loader2, Layers, ChevronRight, Paintbrush } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Material { name: string; finish: string; description: string; }
interface Glazing  { type: string; tint: string; description: string; }
interface FacadeDesign {
  primaryMaterial:   Material;
  secondaryMaterial: Material;
  glazing:           Glazing;
  wwr:               number;
  thermalPerformance: string;
  rValue:            string;
  shadingStrategy:   string;
  openingPattern:    string;
  colorPalette:      string[];
  styleDirection:    string;
  recommendations:   string[];
  northFacade:       string;
  southFacade:       string;
  eastFacade:        string;
  westFacade:        string;
  generatedAt?:      string;
  recommendationsApplied?: boolean;
  appliedAt?:        string;
}

// Map material names to rough colour swatches
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
  return "#6b7280";
}

function MaterialCard({ mat, label }: { mat: Material; label: string }) {
  const bg = materialSwatch(mat.name);
  return (
    <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
      <div className="w-14 h-14 rounded shrink-0 shadow-inner" style={{ backgroundColor: bg, opacity: 0.85 }} />
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
  const params     = useParams();
  const projectId  = parseInt(params.id || "0");
  const { toast }  = useToast();

  const [facade,     setFacade]     = useState<FacadeDesign | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying,   setApplying]   = useState(false);

  const loadMeta = useCallback(async () => {
    if (!projectId) return;
    const res = await fetch(`${BASE}/api/projects/${projectId}`);
    if (!res.ok) return;
    const data = await res.json() as { metadata?: { exterior?: FacadeDesign } };
    if (data.metadata?.exterior) setFacade(data.metadata.exterior);
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/exterior`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { exterior: FacadeDesign };
      setFacade(data.exterior);
      toast({ title: "Facade Design Generated", description: `${data.exterior.styleDirection}` });
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
    toast({ title: "Spec Exported", description: "facade-spec.txt downloaded to your device." });
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

  const hasData = !!facade;

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
            <Download className="w-4 h-4 mr-2" />
            Export Spec
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

      {/* Empty state */}
      {!hasData && !generating && (
        <Card className="border-dashed border-border/50">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold">No Facade Design Yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Generate Facade" to create an AI-driven facade specification tailored to your brief and selected concept.</p>
            </div>
            <Button onClick={handleGenerate} className="mt-2">
              <Building2 className="w-4 h-4 mr-2" />
              Generate Facade
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

      {/* Main content */}
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
                      <p className="text-foreground font-semibold">{facade.openingPattern ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colour Palette */}
              {facade.colorPalette?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Colour Palette</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {facade.colorPalette.map((hex, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full h-10 rounded" style={{ backgroundColor: hex }} />
                          <span className="text-[10px] font-mono text-muted-foreground">{hex}</span>
                        </div>
                      ))}
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
                  <p className="text-xs text-muted-foreground leading-snug">{facade[`${dir.toLowerCase()}Facade` as keyof FacadeDesign] as string ?? "—"}</p>
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
