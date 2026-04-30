import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trees, Download, Loader2, Droplets, Sun, Leaf, Lightbulb, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LandscapeDesign {
  designPhilosophy: string;
  hardscape: {
    primaryPaving:     string;
    retainingElements: string;
    boundaryTreatment: string;
    entrySequence:     string;
  };
  softscape: {
    plantingStrategy: string;
    featuredSpecies:  string[];
    groundCover:      string;
    treePlanting:     string;
    seasonalInterest: string;
  };
  waterManagement: {
    strategy:         string;
    bioswales:        string;
    cisterns:         string;
    surfaceRunoff:     string;
  };
  lighting: {
    pathLighting:     string;
    accentLighting:   string;
    securityLighting:  string;
  };
  performance: {
    permeableArea:         number;
    canopyCoverage10yr:    number;
    biodiversityScore:     number;
    stormwaterReduction:   number;
  };
  sustainability:               string;
  maintenanceSchedule:          string;
  estimatedImplementationCost:  string;
  generatedAt?: string;
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span>{label}</span>
        <span style={{ color }}>{value}{typeof value === "number" && value <= 100 ? "%" : ""}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function ProjectLandscape() {
  const params    = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [landscape,  setLandscape]  = useState<LandscapeDesign | null>(null);
  const [generating, setGenerating] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const loadMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" });
      if (!res.ok) return;
      const meta = await res.json() as { landscape?: LandscapeDesign };
      if (meta.landscape) setLandscape(meta.landscape);
    } finally {
      setMetaLoaded(true);
    }
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const storedLocal = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
      const selectedConceptIdx = storedLocal !== null ? parseInt(storedLocal) || 0 : 0;

      const res = await fetch(`${BASE}/api/projects/${projectId}/landscape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedConceptIdx }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { landscape: LandscapeDesign };
      setLandscape(data.landscape);
      toast({ title: "Landscape Design Generated", description: "Site integration and planting strategy ready." });
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate landscape design. Try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!landscape) {
      toast({ title: "No Data", description: "Generate a landscape design first.", variant: "destructive" });
      return;
    }
    const lines = [
      `LANDSCAPE DESIGN SPECIFICATION — PROJECT ${projectId}`,
      `Generated: ${landscape.generatedAt ? new Date(landscape.generatedAt).toLocaleString() : "—"}`,
      ``,
      `DESIGN PHILOSOPHY`,
      landscape.designPhilosophy,
      ``,
      `HARDSCAPE`,
      `Primary Paving:      ${landscape.hardscape?.primaryPaving}`,
      `Retaining Elements:  ${landscape.hardscape?.retainingElements}`,
      `Boundary Treatment:  ${landscape.hardscape?.boundaryTreatment}`,
      `Entry Sequence:      ${landscape.hardscape?.entrySequence}`,
      ``,
      `SOFTSCAPE`,
      `Planting Strategy:   ${landscape.softscape?.plantingStrategy}`,
      `Featured Species:    ${landscape.softscape?.featuredSpecies?.join(", ")}`,
      `Ground Cover:        ${landscape.softscape?.groundCover}`,
      `Tree Planting:       ${landscape.softscape?.treePlanting}`,
      `Seasonal Interest:   ${landscape.softscape?.seasonalInterest}`,
      ``,
      `WATER MANAGEMENT`,
      `Strategy:            ${landscape.waterManagement?.strategy}`,
      `Bioswales:           ${landscape.waterManagement?.bioswales}`,
      `Cisterns:            ${landscape.waterManagement?.cisterns}`,
      `Surface Runoff:      ${landscape.waterManagement?.surfaceRunoff}`,
      ``,
      `LIGHTING`,
      `Path Lighting:       ${landscape.lighting?.pathLighting}`,
      `Accent Lighting:     ${landscape.lighting?.accentLighting}`,
      `Security Lighting:   ${landscape.lighting?.securityLighting}`,
      ``,
      `PERFORMANCE METRICS`,
      `Permeable Area:      ${landscape.performance?.permeableArea}%`,
      `Canopy Coverage:     ${landscape.performance?.canopyCoverage10yr}% (10yr projection)`,
      `Biodiversity Score:  ${landscape.performance?.biodiversityScore}/10`,
      `Stormwater Reduction:${landscape.performance?.stormwaterReduction}%`,
      ``,
      `SUSTAINABILITY`,
      landscape.sustainability,
      ``,
      `MAINTENANCE`,
      landscape.maintenanceSchedule,
      ``,
      `IMPLEMENTATION COST ESTIMATE`,
      landscape.estimatedImplementationCost,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `landscape-spec-project-${projectId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const perf = landscape?.performance;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landscape Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Site integration and exterior programming.</p>
          {landscape?.generatedAt && (
            <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
              Generated {new Date(landscape.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!landscape}>
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trees className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate Design"}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {metaLoaded && !landscape && !generating && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-xl">
          <Trees className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No landscape design generated yet.</p>
          <p className="text-xs text-muted-foreground/60">Click Generate Design to create a site-specific landscape strategy.</p>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-10 h-10 text-primary/60 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">AI is designing your landscape strategy…</p>
        </div>
      )}

      {landscape && !generating && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Design philosophy */}
          {landscape.designPhilosophy && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1.5">Design Philosophy</p>
              <p className="text-sm text-foreground leading-relaxed">{landscape.designPhilosophy}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Hardscape + Softscape */}
            <div className="md:col-span-2 space-y-4">

              {/* Hardscape */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    Hardscape
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Primary Paving",     value: landscape.hardscape?.primaryPaving },
                      { label: "Retaining Elements", value: landscape.hardscape?.retainingElements },
                      { label: "Boundary Treatment", value: landscape.hardscape?.boundaryTreatment },
                      { label: "Entry Sequence",     value: landscape.hardscape?.entrySequence },
                    ].map(r => (
                      <div key={r.label} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{r.label}</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Softscape */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-500" />
                    Softscape & Planting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {landscape.softscape?.plantingStrategy && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{landscape.softscape.plantingStrategy}</p>
                  )}
                  {landscape.softscape?.featuredSpecies?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Featured Species</p>
                      <div className="flex flex-wrap gap-2">
                        {landscape.softscape.featuredSpecies.map((sp, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {[
                      { label: "Ground Cover",     value: landscape.softscape?.groundCover },
                      { label: "Tree Planting",    value: landscape.softscape?.treePlanting },
                      { label: "Seasonal Interest",value: landscape.softscape?.seasonalInterest },
                    ].map(r => (
                      <div key={r.label} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{r.label}</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Water + Lighting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      Water Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {[
                      { label: "Strategy",       value: landscape.waterManagement?.strategy },
                      { label: "Bioswales",      value: landscape.waterManagement?.bioswales },
                      { label: "Cisterns",       value: landscape.waterManagement?.cisterns },
                      { label: "Surface Runoff", value: landscape.waterManagement?.surfaceRunoff },
                    ].map(r => (
                      <div key={r.label}>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">{r.label}</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.value || "—"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      Exterior Lighting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {[
                      { label: "Path Lighting",     value: landscape.lighting?.pathLighting },
                      { label: "Accent Lighting",   value: landscape.lighting?.accentLighting },
                      { label: "Security Lighting", value: landscape.lighting?.securityLighting },
                    ].map(r => (
                      <div key={r.label}>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">{r.label}</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.value || "—"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right: Performance metrics + sustainability + cost */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {perf && (
                    <>
                      <MetricBar label="Permeable Area"        value={perf.permeableArea}       max={100} color="#22c55e" />
                      <MetricBar label="Canopy Coverage (10yr)" value={perf.canopyCoverage10yr}  max={100} color="#f59e0b" />
                      <MetricBar label="Biodiversity Score"    value={perf.biodiversityScore}    max={10}  color="#6366f1" />
                      <MetricBar label="Stormwater Reduction"  value={perf.stormwaterReduction}  max={100} color="#38bdf8" />
                    </>
                  )}
                </CardContent>
              </Card>

              {landscape.sustainability && (
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-4 h-4 text-green-500" />
                      <h4 className="font-bold text-sm text-green-400">Sustainability</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{landscape.sustainability}</p>
                  </CardContent>
                </Card>
              )}

              {landscape.maintenanceSchedule && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-sm">Maintenance</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{landscape.maintenanceSchedule}</p>
                  </CardContent>
                </Card>
              )}

              {landscape.estimatedImplementationCost && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Cost Estimate</p>
                    <p className="text-sm font-semibold text-foreground">{landscape.estimatedImplementationCost}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
