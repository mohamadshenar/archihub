import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileBox, FileImage, FileText, Archive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ProjectExport() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadProject = useCallback(() => {
    fetch(`${BASE}/api/projects/${projectId}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProject(d as Record<string, unknown>); })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const meta = (project?.metadata as Record<string, unknown>) ?? {};
  const analysis = project?.siteAnalysis as Record<string, unknown> | null;

  const handlePresentationPDF = () => {
    const url = `${window.location.origin}${BASE}/projects/${projectId}/presentation`;
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => win.print(), 1000);
      });
    }
    toast({ title: "Opening Presentation", description: "Use your browser's print dialog to save as PDF." });
  };

  const handleSiteAnalysisReport = () => {
    if (!project || !analysis) {
      toast({ title: "No Data", description: "Run the site analysis first.", variant: "destructive" }); return;
    }
    const lines = [
      `SITE ANALYSIS REPORT — ${project.name ?? "Project"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      `PROJECT: ${project.name} (${project.projectType})`,
      `LOCATION: ${project.address ?? "Unknown"}`,
      `SITE AREA: ${project.siteArea ?? "N/A"} m²`,
      `FLOORS: ${project.numFloors ?? "N/A"}`,
      "",
      "─── CLIMATE & ENVIRONMENT ───",
      `Climate: ${analysis.climate ?? "N/A"}`,
      `Sun Exposure: ${analysis.sunExposure ?? "N/A"}`,
      `Wind Direction: ${analysis.windDirection ?? "N/A"}`,
      `Topography: ${analysis.topography ?? "N/A"}`,
      `Soil Type: ${analysis.soilType ?? "N/A"}`,
      "",
      "─── CONTEXT ───",
      `Surrounding Context: ${analysis.surroundingContext ?? "N/A"}`,
      `Zoning: ${analysis.zoningInfo ?? "N/A"}`,
      `Accessibility: ${analysis.accessibilityNotes ?? "N/A"}`,
      `Sustainability Score: ${analysis.sustainabilityScore ?? "N/A"} / 100`,
      "",
      "─── OPPORTUNITIES ───",
      ...((analysis.opportunities as string[] | undefined) ?? []).map(o => `• ${o}`),
      "",
      "─── CONSTRAINTS ───",
      ...((analysis.constraints as string[] | undefined) ?? []).map(c => `• ${c}`),
      "",
      "─── DESIGN RECOMMENDATIONS ───",
      ...((analysis.recommendations as string[] | undefined) ?? []).map(r => `• ${r}`),
    ];
    downloadText(`site-analysis-project-${projectId}.txt`, lines.join("\n"));
    toast({ title: "Downloaded", description: "site-analysis-report.txt saved." });
  };

  const handleClientBriefDownload = () => {
    if (!project) return;
    const brief = (meta.brief as Record<string, unknown>) ?? {};
    const lines = [
      `CLIENT BRIEF — ${project.name ?? "Project"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      `PROJECT: ${project.name} (${project.projectType})`,
      "",
      "─── BRIEF ───",
      `Must Have: ${brief.mustHave ?? "Not specified"}`,
      `Avoid: ${brief.avoid ?? "Not specified"}`,
      `Styles: ${((brief.styles as string[] | undefined) ?? []).join(", ") || "Not specified"}`,
      `Sustainability: ${((brief.sustainability as string[] | undefined) ?? []).join(", ") || "Not specified"}`,
      `Budget Priority: ${brief.budgetPriority ?? "Not specified"} / 10`,
    ];
    downloadText(`client-brief-project-${projectId}.txt`, lines.join("\n"));
    toast({ title: "Downloaded", description: "client-brief.txt saved." });
  };

  const handleExteriorSpec = () => {
    const ext = meta.exterior as Record<string, unknown> | undefined;
    if (!ext) { toast({ title: "No exterior spec", description: "Generate exterior design first.", variant: "destructive" }); return; }
    const mat = ext.primaryMaterial as Record<string, unknown> | undefined;
    const lines = [
      `EXTERIOR DESIGN SPEC — ${project?.name ?? "Project"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      `Style: ${ext.selectedStyle ?? "N/A"}`,
      `System: ${ext.facadeSystem ?? "N/A"}`,
      `Concept: ${ext.designConcept ?? "N/A"}`,
      "",
      "─── PRIMARY MATERIAL ───",
      `Name: ${mat?.name ?? "N/A"}`,
      `Manufacturer: ${mat?.manufacturer ?? "N/A"}`,
      `Finish: ${mat?.finish ?? "N/A"}`,
      `U-Value: ${mat?.uValue ?? "N/A"}`,
      `SHGC: ${mat?.shgc ?? "N/A"}`,
    ];
    downloadText(`exterior-spec-project-${projectId}.txt`, lines.join("\n"));
    toast({ title: "Downloaded", description: "exterior-spec.txt saved." });
  };

  const handleFullZIP = () => {
    if (!project) { toast({ title: "Loading…", description: "Project data not yet loaded." }); return; }
    setDownloading("zip");
    try {
      downloadJson(`full-project-${projectId}.json`, project);
      toast({ title: "Full Project Package Downloaded", description: "All project data exported as JSON." });
    } finally {
      setDownloading(null);
    }
  };

  const EXPORTS = [
    {
      name: "Concept Presentation Board",
      icon: FileImage, type: "PDF", desc: "Opens the final presentation poster and prompts browser print/save as PDF.",
      action: handlePresentationPDF,
      available: true,
    },
    {
      name: "Site Analysis Report",
      icon: FileText, type: "TXT", desc: "Climate, context, opportunities, constraints, and recommendations.",
      action: handleSiteAnalysisReport,
      available: !!analysis,
    },
    {
      name: "Client Brief & Program",
      icon: FileText, type: "TXT", desc: "Design brief, style preferences, sustainability goals.",
      action: handleClientBriefDownload,
      available: !!meta.brief,
    },
    {
      name: "Exterior Design Spec",
      icon: FileText, type: "TXT", desc: "Facade system, materials, performance metrics.",
      action: handleExteriorSpec,
      available: !!meta.exterior,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Files</h1>
          <p className="text-sm text-muted-foreground font-mono">Download project deliverables and data.</p>
        </div>
        <Button onClick={handleFullZIP} disabled={!!downloading || loading} className="bg-primary text-primary-foreground">
          {downloading === "zip" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
          Download Full Project JSON
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORTS.map((item, i) => (
            <Card key={i} className={`hover:border-primary/50 transition-colors ${!item.available ? "opacity-50" : ""}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-3 rounded-lg text-primary">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.available ? "Ready" : "Not generated yet"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!item.available || !!downloading}
                  onClick={item.action}
                >
                  <Download className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-lg text-primary">
                  <FileBox className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Full Project Data</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                    <span>JSON</span>
                    <span>•</span>
                    <span>Ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Complete project record — all AI outputs, specs, images, metadata.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" disabled={!!downloading || loading} onClick={handleFullZIP}>
                <Download className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
