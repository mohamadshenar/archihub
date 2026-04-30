import { useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, AlertTriangle, HelpCircle, Loader2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ComplianceCheck {
  name: string;
  status: "compliant" | "warning" | "non-compliant" | "pending";
  detail: string;
}

interface RegulationsData {
  jurisdiction: string;
  buildingCode: string;
  zoningCode: string;
  checks: ComplianceCheck[];
  criticalActions: string[];
  flaggedItems: string[];
  generatedAt?: string;
}

export default function ProjectRegulations() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [data, setData] = useState<RegulationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [flagging, setFlagging] = useState<string | null>(null);

  const loadMeta = useCallback(() => {
    fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(meta => {
        if (meta?.regulations) setData(meta.regulations as RegulationsData);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/regulations`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { regulations: RegulationsData };
      setData(json.regulations);
      toast({ title: "Compliance Scan Complete", description: "Building code check finished." });
    } catch {
      toast({ title: "Scan Failed", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleFlag = async (action: string) => {
    setFlagging(action);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/regulations/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json() as { flaggedItems: string[] };
      setData(prev => prev ? { ...prev, flaggedItems: json.flaggedItems } : prev);
      toast({ title: "Action Flagged", description: "Item flagged for design team review." });
    } catch {
      toast({ title: "Failed to flag", variant: "destructive" });
    } finally {
      setFlagging(null);
    }
  };

  const warnings = (data?.checks ?? []).filter(c => c.status === "warning" || c.status === "non-compliant");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Code & Regulations</h1>
          <p className="text-sm text-muted-foreground font-mono">Automated compliance checking.</p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          {data ? "Re-run Scan" : "Run Full Scan"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !data ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <FileText className="w-14 h-14 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">No Compliance Data</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Run the full scan to check this project against local building codes and regulations.</p>
            <Button onClick={handleScan} disabled={scanning}>
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Run Full Scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {data.checks.map((check, i) => (
              <Card key={i} className={`overflow-hidden transition-colors ${check.status === "warning" ? "border-amber-500/50 bg-amber-500/5" : check.status === "non-compliant" ? "border-destructive/50 bg-destructive/5" : "hover:border-border"}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {check.status === "compliant" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {check.status === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {check.status === "non-compliant" && <AlertTriangle className="w-5 h-5 text-destructive" />}
                    {check.status === "pending" && <HelpCircle className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm">{check.name}</h4>
                      <Badge
                        variant={check.status === "compliant" ? "outline" : "secondary"}
                        className={
                          check.status === "warning" ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" :
                          check.status === "non-compliant" ? "bg-destructive/20 text-destructive hover:bg-destructive/30" :
                          "text-green-500 border-green-500/30"
                        }
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            {(warnings.length > 0 || (data.criticalActions ?? []).length > 0) && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>The current design requires modifications to pass planning approval.</p>
                  <div className="space-y-2">
                    {(data.criticalActions ?? []).map((action, i) => {
                      const isFlagged = (data.flaggedItems ?? []).includes(action);
                      return (
                        <Button
                          key={i}
                          size="sm"
                          variant={isFlagged ? "outline" : "destructive"}
                          className="w-full justify-start text-left h-auto py-2"
                          disabled={isFlagged || flagging === action}
                          onClick={() => handleFlag(action)}
                        >
                          {flagging === action ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin shrink-0" />
                          ) : (
                            <Flag className={`w-3 h-3 mr-2 shrink-0 ${isFlagged ? "text-primary" : ""}`} />
                          )}
                          <span className="font-mono mr-2">{i + 1}.</span>
                          {action}
                          {isFlagged && <span className="ml-auto text-[10px] text-primary font-mono">FLAGGED</span>}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Local Jurisdiction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{data.jurisdiction}</p>
                <p className="text-xs text-muted-foreground mt-1">Zoning Code: {data.zoningCode}</p>
                <p className="text-xs text-muted-foreground mt-1">Building Code: {data.buildingCode}</p>
                {data.generatedAt && (
                  <p className="text-xs text-muted-foreground mt-3 font-mono">
                    Scanned {new Date(data.generatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">Compliant</span>
                  <span className="font-mono">{data.checks.filter(c => c.status === "compliant").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-500">Warning</span>
                  <span className="font-mono">{data.checks.filter(c => c.status === "warning").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Non-compliant</span>
                  <span className="font-mono">{data.checks.filter(c => c.status === "non-compliant").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
