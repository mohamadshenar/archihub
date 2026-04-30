import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Trees, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LandscapeDesign {
  designPhilosophy: string;
  hardscape: { primaryPaving: string; retainingElements: string; boundaryTreatment: string; entrySequence: string };
  softscape: { plantingStrategy: string; featuredSpecies: string[]; groundCover: string; treePlanting: string; seasonalInterest: string };
  waterManagement: { strategy: string; bioswales: string; cisterns: string; surfaceRunoff: string };
  lighting: { pathLighting: string; accentLighting: string; securityLighting: string };
  performance: { permeableArea: number; canopyCoverage10yr: number; biodiversityScore: number; stormwaterReduction: number };
  sustainability: string;
  maintenanceSchedule: string;
  estimatedImplementationCost: string;
  generatedAt?: string;
}

function Node({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 items-start group">
      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-2">{label}</span>
        <span className="text-sm text-foreground/80">{value}</span>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/70">{title}</h3>
      <div className="space-y-2 pl-1">{children}</div>
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
      toast({ title: "Landscape Design Generated" });
    } catch {
      toast({ title: "Generation Failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!landscape) { toast({ title: "Generate first", variant: "destructive" }); return; }
    const lines = [
      `LANDSCAPE SPECIFICATION — PROJECT ${projectId}`,
      ``,
      landscape.designPhilosophy,
      ``,
      `HARDSCAPE`,
      `· ${landscape.hardscape?.primaryPaving}`,
      `· ${landscape.hardscape?.retainingElements}`,
      `· ${landscape.hardscape?.boundaryTreatment}`,
      `· ${landscape.hardscape?.entrySequence}`,
      ``,
      `SOFTSCAPE`,
      `· ${landscape.softscape?.plantingStrategy}`,
      `· Species: ${landscape.softscape?.featuredSpecies?.join(", ")}`,
      `· ${landscape.softscape?.groundCover}`,
      `· ${landscape.softscape?.treePlanting}`,
      ``,
      `WATER`,
      `· ${landscape.waterManagement?.strategy}`,
      `· ${landscape.waterManagement?.bioswales}`,
      ``,
      `LIGHTING`,
      `· ${landscape.lighting?.pathLighting}`,
      `· ${landscape.lighting?.accentLighting}`,
      ``,
      `PERFORMANCE`,
      `· Permeable: ${landscape.performance?.permeableArea}%`,
      `· Canopy (10yr): ${landscape.performance?.canopyCoverage10yr}%`,
      `· Stormwater reduction: ${landscape.performance?.stormwaterReduction}%`,
      ``,
      `SUSTAINABILITY`,
      landscape.sustainability,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `landscape-project-${projectId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landscape Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Site integration and exterior programming.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!landscape}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trees className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate Design"}
          </Button>
        </div>
      </div>

      {/* Empty / loading */}
      {metaLoaded && !landscape && !generating && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/40 rounded-xl">
          <Trees className="w-8 h-8 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">Click Generate Design to create your landscape strategy.</p>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary/60 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-mono">Designing…</p>
        </div>
      )}

      {landscape && !generating && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

          {/* Philosophy */}
          {landscape.designPhilosophy && (
            <p className="text-base text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-4 italic">
              {landscape.designPhilosophy}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <Section title="Hardscape">
                <Node label="Paving"    value={landscape.hardscape?.primaryPaving} />
                <Node label="Retaining" value={landscape.hardscape?.retainingElements} />
                <Node label="Boundary"  value={landscape.hardscape?.boundaryTreatment} />
                <Node label="Entry"     value={landscape.hardscape?.entrySequence} />
              </Section>

              <Section title="Softscape">
                <Node label="Strategy"  value={landscape.softscape?.plantingStrategy} />
                <Node label="Ground"    value={landscape.softscape?.groundCover} />
                <Node label="Trees"     value={landscape.softscape?.treePlanting} />
                {landscape.softscape?.featuredSpecies?.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {landscape.softscape.featuredSpecies.map((sp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono">{sp}</span>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Water">
                <Node label="Strategy"  value={landscape.waterManagement?.strategy} />
                <Node label="Bioswales" value={landscape.waterManagement?.bioswales} />
              </Section>
            </div>

            <div className="space-y-8">
              <Section title="Lighting">
                <Node label="Path"     value={landscape.lighting?.pathLighting} />
                <Node label="Accent"   value={landscape.lighting?.accentLighting} />
                <Node label="Security" value={landscape.lighting?.securityLighting} />
              </Section>

              <Section title="Performance">
                {[
                  { label: "Permeable area",    value: `${landscape.performance?.permeableArea}%`,      color: "#22c55e" },
                  { label: "Canopy (10yr)",      value: `${landscape.performance?.canopyCoverage10yr}%`, color: "#f59e0b" },
                  { label: "Stormwater reduction", value: `${landscape.performance?.stormwaterReduction}%`, color: "#38bdf8" },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center text-xs font-mono border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </Section>

              {landscape.sustainability && (
                <Section title="Sustainability">
                  <p className="text-sm text-foreground/70 leading-relaxed">{landscape.sustainability}</p>
                </Section>
              )}

              {landscape.maintenanceSchedule && (
                <Section title="Maintenance">
                  <p className="text-sm text-foreground/70 leading-relaxed">{landscape.maintenanceSchedule}</p>
                </Section>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
