import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Download, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SiteAnalysis {
  climate?: string;
  surroundingContext?: string;
  opportunities?: string[];
  constraints?: string[];
  recommendations?: string[];
  zoningInfo?: string;
  topography?: string;
  windDirection?: string;
  sunExposure?: string;
  sustainabilityScore?: number;
}

interface ProjectData {
  name?: string;
  projectType?: string;
  address?: string;
  siteArea?: number;
  numFloors?: number;
  siteAnalysis?: SiteAnalysis;
}

export default function ProjectContext() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(() => {
    fetch(`${BASE}/api/projects/${projectId}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProject(d as ProjectData); })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const analysis = project?.siteAnalysis;

  const handleGenerateReport = () => {
    if (!project) return;
    const a = analysis;
    const lines = [
      `CONTEXT STUDY REPORT — ${project.name ?? "Project"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      `PROJECT TYPE: ${project.projectType ?? "Unknown"}`,
      `LOCATION: ${project.address ?? "Unknown"}`,
      `SITE AREA: ${project.siteArea ?? "N/A"} m²`,
      `FLOORS: ${project.numFloors ?? "N/A"}`,
      "",
      "─── SITE ANALYSIS ───",
      `Climate: ${a?.climate ?? "Not analyzed"}`,
      `Sun Exposure: ${a?.sunExposure ?? "Not analyzed"}`,
      `Wind: ${a?.windDirection ?? "Not analyzed"}`,
      `Topography: ${a?.topography ?? "Not analyzed"}`,
      `Surrounding Context: ${a?.surroundingContext ?? "Not analyzed"}`,
      `Zoning: ${a?.zoningInfo ?? "Not analyzed"}`,
      `Sustainability Score: ${a?.sustainabilityScore ?? "N/A"} / 100`,
      "",
      "─── OPPORTUNITIES ───",
      ...(a?.opportunities ?? ["No data"]).map(o => `• ${o}`),
      "",
      "─── CONSTRAINTS ───",
      ...(a?.constraints ?? ["No data"]).map(c => `• ${c}`),
      "",
      "─── RECOMMENDATIONS ───",
      ...(a?.recommendations ?? ["No data"]).map(r => `• ${r}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `context-study-project-${projectId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: "context-study.txt saved to your downloads." });
  };

  const handleAnalyze = () => {
    toast({ title: "Run Site Analysis First", description: "Go to Site Analysis to generate AI context data." });
  };

  const opp = analysis?.opportunities ?? [];
  const con = analysis?.constraints ?? [];
  const rec = analysis?.recommendations ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Context Study</h1>
          <p className="text-sm text-muted-foreground font-mono">Urban integration and socio-cultural fabric.</p>
        </div>
        <div className="flex items-center gap-4">
          {analysis && (
            <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Context Data Loaded
            </span>
          )}
          <Button variant="outline" onClick={handleGenerateReport} disabled={loading || !analysis}>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button onClick={handleAnalyze}>
            <Map className="w-4 h-4 mr-2" />
            Analyze Context
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !analysis ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Map className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">No Site Analysis Data</h3>
            <p className="text-sm text-muted-foreground mt-2">Complete the Site Analysis step first to populate context data here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SWOT derived from real analysis */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>SWOT Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-green-500">
                  <h4 className="font-semibold text-green-500 mb-2">Strengths</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {opp.slice(0, 3).map((o, i) => <li key={i}>• {o}</li>)}
                    {opp.length === 0 && <li className="opacity-50">Run site analysis to populate</li>}
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-red-500">
                  <h4 className="font-semibold text-red-500 mb-2">Weaknesses</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {con.slice(0, 3).map((c, i) => <li key={i}>• {c}</li>)}
                    {con.length === 0 && <li className="opacity-50">No constraints identified</li>}
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-blue-500">
                  <h4 className="font-semibold text-blue-500 mb-2">Opportunities</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {opp.slice(3).map((o, i) => <li key={i}>• {o}</li>)}
                    {opp.length <= 3 && <li className="opacity-50">Additional site survey recommended</li>}
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-orange-500">
                  <h4 className="font-semibold text-orange-500 mb-2">Threats</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {con.slice(3).map((c, i) => <li key={i}>• {c}</li>)}
                    {con.length <= 3 && <li className="opacity-50">Regulatory review advised</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Urban Fabric</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.surroundingContext ?? "Context not analyzed yet."}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Building Heights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-16 w-full">
                  <div className="bg-muted w-1/5 h-3/5 rounded-t"></div>
                  <div className="bg-muted w-1/5 h-4/5 rounded-t"></div>
                  <div className="bg-primary/50 w-1/5 h-full rounded-t flex items-end justify-center pb-1">
                    <span className="text-[10px] font-mono">SITE</span>
                  </div>
                  <div className="bg-muted w-1/5 h-2/5 rounded-t"></div>
                  <div className="bg-muted w-1/5 h-5/5 rounded-t"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
                  {project?.numFloors ? `${project.numFloors} FL proposed — Contextual Skyline Profile` : "Contextual Skyline Profile"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Design Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rec.slice(0, 4).map((r, i) => (
                    <li key={i} className="text-sm border-l-2 border-primary/30 pl-3">{r}</li>
                  ))}
                  {rec.length === 0 && <li className="text-sm text-muted-foreground opacity-50">Run site analysis to get recommendations</li>}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
