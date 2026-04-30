import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Sun, Wind, Droplets, ArrowRight, Loader2, Zap, TreePine } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SustainabilityData {
  overallScore: number;
  targetRating: string;
  metrics: {
    daylightAutonomy: number;
    naturalVentilation: number;
    energyEfficiency: number;
    waterEfficiency: number;
    embodiedCarbon?: number;
    biodiversity?: number;
  };
  recommendations: string[];
  appliedStrategies: string[];
  summaryNote?: string;
  generatedAt?: string;
}

export default function ProjectSustainability() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [data, setData] = useState<SustainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadMeta = useCallback(() => {
    fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(meta => {
        if (meta?.sustainability) setData(meta.sustainability as SustainabilityData);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/sustainability`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { sustainability: SustainabilityData };
      setData(json.sustainability);
      toast({ title: "Analysis Complete", description: "Sustainability targets computed for your project." });
    } catch {
      toast({ title: "Generation Failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyStrategies = async () => {
    if (!data) return;
    setApplying(true);
    try {
      await fetch(`${BASE}/api/projects/${projectId}/sustainability/apply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategies: data.recommendations }),
      });
      setData(prev => prev ? { ...prev, appliedStrategies: prev.recommendations } : prev);
      toast({ title: "Strategies Applied", description: "All recommendations integrated into design parameters." });
    } catch {
      toast({ title: "Failed to apply", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const METRIC_ICONS = [
    { key: "daylightAutonomy", label: "Daylight Autonomy", icon: Sun, color: "text-amber-500" },
    { key: "naturalVentilation", label: "Natural Ventilation", icon: Wind, color: "text-sky-500" },
    { key: "energyEfficiency", label: "Energy Efficiency", icon: Zap, color: "text-emerald-500" },
    { key: "waterEfficiency", label: "Water Efficiency", icon: Droplets, color: "text-blue-500" },
    { key: "embodiedCarbon", label: "Low Embodied Carbon", icon: Leaf, color: "text-green-500" },
    { key: "biodiversity", label: "Biodiversity Score", icon: TreePine, color: "text-teal-500" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sustainability Check</h1>
          <p className="text-sm text-muted-foreground font-mono">Environmental performance and resource efficiency.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Leaf className="w-4 h-4 mr-2" />}
          {data ? "Re-run Analysis" : "Run Climate Analysis"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !data ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Leaf className="w-14 h-14 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">No Analysis Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Run the climate analysis engine to generate sustainability targets for this project.</p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Leaf className="w-4 h-4 mr-2" />}
              Run Climate Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20 md:col-span-1">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="text-6xl font-bold text-primary mb-2">{data.overallScore}</div>
                <p className="text-sm font-medium">{data.targetRating}</p>
                {data.summaryNote && (
                  <p className="text-xs text-muted-foreground text-center mt-4">{data.summaryNote}</p>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {METRIC_ICONS.map(({ key, label, icon: Icon, color }) => {
                const val = data.metrics[key as keyof typeof data.metrics] as number | undefined;
                if (val === undefined) return null;
                return (
                  <Card key={key}>
                    <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="font-semibold text-sm">{label}</span>
                        </div>
                        <span className="font-mono text-sm">{val}%</span>
                      </div>
                      <Progress value={val} className="h-1.5" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className={`flex gap-3 items-start p-3 rounded-lg transition-colors ${data.appliedStrategies.includes(rec) ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                    <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 ${data.appliedStrategies.includes(rec) ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm">{rec}</p>
                    {data.appliedStrategies.includes(rec) && (
                      <span className="text-[10px] font-mono text-primary shrink-0 mt-0.5">APPLIED</span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-6"
                variant="secondary"
                onClick={handleApplyStrategies}
                disabled={applying || data.appliedStrategies.length === data.recommendations.length}
              >
                {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Leaf className="w-4 h-4 mr-2" />}
                {data.appliedStrategies.length === data.recommendations.length ? "All Strategies Applied" : "Apply Optimization Strategies"}
              </Button>
            </CardContent>
          </Card>

          {data.generatedAt && (
            <p className="text-xs text-muted-foreground font-mono text-center">
              Generated {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </motion.div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
