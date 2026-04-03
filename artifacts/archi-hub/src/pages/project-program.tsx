import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutTemplate, ArrowRight, Loader2, Plus, Trash2, Layers, RefreshCw, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { getTypeLabel } from "@/lib/project-utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface FunctionRow {
  id: string;
  name: string;
  fromFloor: string;
  toFloor: string;
}

interface FloorGroup {
  floorRange: string;
  functionName: string;
  areaPerFloor: number;
  description: string;
  keySpaces: string[];
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function defaultFunctions(): FunctionRow[] {
  return [{ id: uid(), name: "", fromFloor: "", toFloor: "" }];
}

export default function ProjectProgram() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const [showForm, setShowForm] = useState(false);
  const [totalArea, setTotalArea] = useState("");
  const [functions, setFunctions] = useState<FunctionRow[]>(defaultFunctions());
  const [isGenerating, setIsGenerating] = useState(false);

  const program = project?.program as (Record<string, unknown> & { floors?: FloorGroup[]; _input?: { totalArea?: number; functions?: FunctionRow[] } }) | undefined;
  const floors = program?.floors as FloorGroup[] | undefined;
  const numFloors = project?.numFloors;

  useEffect(() => {
    if (!program) {
      setShowForm(true);
    } else {
      setShowForm(false);
      if (program._input) {
        setTotalArea(String(program._input.totalArea ?? ""));
        if (program._input.functions && program._input.functions.length > 0) {
          setFunctions(program._input.functions.map(f => ({ ...f, id: uid() })));
        }
      }
    }
  }, [!!program]);

  const addRow = () => setFunctions(prev => [...prev, { id: uid(), name: "", fromFloor: "", toFloor: "" }]);
  const removeRow = (id: string) => setFunctions(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, field: keyof FunctionRow, value: string) =>
    setFunctions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleGenerate = async () => {
    if (!totalArea) {
      toast({ title: "Required Area Missing", description: "Please enter the required total area in sqm.", variant: "destructive" });
      return;
    }
    const validFunctions = functions.filter(f => f.name.trim());
    if (validFunctions.length === 0) {
      toast({ title: "Functions Required", description: "Add at least one program function.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch(`${BASE}/api/projects/${projectId}/program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalArea: Number(totalArea), functions: validFunctions }),
      });
      if (!resp.ok) throw new Error("Generation failed");
      await queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      toast({ title: "Program Generated", description: "Floor-by-floor program compiled successfully." });
      setShowForm(false);
    } catch {
      toast({ title: "Error", description: "Failed to generate program. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!project) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Architectural Program</h1>
            <p className="text-sm text-muted-foreground font-mono">Spatial and qualitative specification.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {program && !showForm && (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Reconfigure
            </Button>
          )}
          {program && !showForm && (
            <Link href={`/projects/${projectId}/visualization`}>
              <Button variant="secondary">Generate Imagery <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap font-mono text-xs text-muted-foreground border border-border/40 bg-card/30 px-4 py-2 rounded-none">
        <span className="uppercase tracking-wider">Project</span>
        <span className="text-foreground font-medium">{project.name}</span>
        <span className="text-border/60">|</span>
        <span className="uppercase tracking-wider">Type</span>
        <span className="text-foreground font-medium">{getTypeLabel(project.projectType)}</span>
        {numFloors && (
          <>
            <span className="text-border/60">|</span>
            <span className="uppercase tracking-wider">Floors</span>
            <span className="text-primary font-bold">{numFloors}</span>
          </>
        )}
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {!numFloors && (
            <div className="border border-amber-500/30 bg-amber-500/5 px-4 py-3 font-mono text-xs text-amber-400 rounded-none">
              ⚠ No floor count set for this project. Go to Project Overview → Edit to add the number of floors for a more accurate program.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                Required Total Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  type="number"
                  placeholder="e.g. 35000"
                  value={totalArea}
                  onChange={e => setTotalArea(e.target.value)}
                  className="font-mono text-lg h-11 rounded-none"
                />
                <span className="text-muted-foreground font-mono text-sm shrink-0">sqm</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Program Functions
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addRow} className="gap-1 rounded-none">
                <Plus className="w-3 h-3" /> Add Function
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_110px_110px_36px] gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-1 pb-1">
                  <span>Function / Space</span>
                  <span>From Floor</span>
                  <span>To Floor</span>
                  <span></span>
                </div>
                {functions.map(row => (
                  <div key={row.id} className="grid grid-cols-[1fr_110px_110px_36px] gap-2 items-center">
                    <Input
                      placeholder="e.g. Office Space"
                      value={row.name}
                      onChange={e => updateRow(row.id, "name", e.target.value)}
                      className="rounded-none h-9"
                    />
                    <Input
                      placeholder="e.g. 6 or B1"
                      value={row.fromFloor}
                      onChange={e => updateRow(row.id, "fromFloor", e.target.value)}
                      className="rounded-none h-9 font-mono text-center"
                    />
                    <Input
                      placeholder={numFloors ? String(numFloors) : "e.g. 35"}
                      value={row.toFloor}
                      onChange={e => updateRow(row.id, "toFloor", e.target.value)}
                      className="rounded-none h-9 font-mono text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      disabled={functions.length === 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-muted-foreground/60 mt-4">
                Use integers for floors (1, 2, 35), G for Ground, B1/B2 for basements.
                {numFloors ? ` This project has ${numFloors} floors.` : ""}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="min-w-44">
              {isGenerating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><LayoutTemplate className="w-4 h-4 mr-2" />Generate Program</>
              }
            </Button>
          </div>

          {isGenerating && (
            <div className="border border-primary/20 bg-primary/5 px-6 py-8 text-center font-mono text-sm text-muted-foreground">
              <LayoutTemplate className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
              Compiling floor-by-floor architectural program…<br />
              <span className="text-xs text-muted-foreground/60">This may take 15–30 seconds.</span>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1 bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                <Maximize className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-mono text-muted-foreground uppercase">Total Area</span>
                <span className="text-3xl font-bold mt-1">
                  {program?.totalArea?.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sqm</span>
                </span>
                {numFloors && (
                  <div className="mt-3 pt-3 border-t border-primary/20 w-full text-center">
                    <span className="text-sm font-mono text-muted-foreground uppercase">Floors</span>
                    <div className="text-2xl font-bold text-primary">{numFloors}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Design Philosophy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{String(program?.styleDirection ?? "")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Principles</h4>
                    <ul className="text-sm space-y-1">
                      {(program?.designPrinciples as string[] | undefined)?.map((p, i) => <li key={i}>• {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {(program?.materialPalette as string[] | undefined)?.map((m, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs rounded-none border-primary/30 text-primary/80">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {(program?.estimatedBudget || program?.timeline) && (
                  <div className="flex gap-6 pt-2 border-t border-border/40 text-sm font-mono">
                    {program?.estimatedBudget && <span><span className="text-muted-foreground">Budget: </span>{String(program.estimatedBudget)}</span>}
                    {program?.timeline && <span><span className="text-muted-foreground">Timeline: </span>{String(program.timeline)}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {floors && floors.length > 0 && (
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Floor-by-Floor Program
              </h3>
              <div className="space-y-3">
                {floors.map((floor, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="overflow-hidden border-l-4 border-l-primary/40 hover:border-l-primary transition-colors">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-primary/10 border-r border-border/50 flex flex-col items-center justify-center px-5 py-4 min-w-[110px] shrink-0">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Floor</span>
                            <span className="text-xl font-bold font-mono text-primary">{floor.floorRange}</span>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className="font-semibold text-base leading-tight">{floor.functionName}</h4>
                              <span className="font-mono text-sm text-primary whitespace-nowrap shrink-0">
                                {floor.areaPerFloor?.toLocaleString()} sqm/flr
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{floor.description}</p>
                            {floor.keySpaces && floor.keySpaces.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {floor.keySpaces.map((space, j) => (
                                  <span key={j} className="text-xs font-mono bg-muted/50 border border-border/40 px-2 py-0.5 text-muted-foreground">
                                    {space}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      <WorkflowNav projectId={projectId} />
    </div>
  );
}
