import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useRunSiteAnalysis,
  ProjectStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, Wind, Sun, Mountain, Leaf, AlertTriangle, Lightbulb, Building2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ProjectAnalysis() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: isProjectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { mutate: analyze, isPending: isAnalyzing } = useRunSiteAnalysis();

  const handleAnalyze = () => {
    analyze(
      { id: projectId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({
            title: "Analysis Complete",
            description: "AI site analysis executed successfully."
          });
        }
      }
    );
  };

  if (isProjectLoading) return <div className="p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!project) return <div>Not found</div>;

  const analysis = project.siteAnalysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Site Analysis</h1>
            <p className="text-sm text-muted-foreground font-mono">Geospatial and contextual intelligence.</p>
          </div>
        </div>
        {!analysis && project.latitude && (
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <BrainCircuit className="w-4 h-4 mr-2 animate-pulse text-primary" />
            ) : (
              <BrainCircuit className="w-4 h-4 mr-2" />
            )}
            Run Analysis Engine
          </Button>
        )}
      </div>

      {!project.latitude ? (
        <Card className="border-dashed border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="w-12 h-12 text-destructive mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-destructive">Location Required</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Site coordinates must be established before analysis can commence.</p>
            <Link href={`/projects/${projectId}/site`}>
              <Button variant="outline">Set Location</Button>
            </Link>
          </CardContent>
        </Card>
      ) : !analysis ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-24 text-center">
            <BrainCircuit className={`w-16 h-16 mb-6 ${isAnalyzing ? "text-primary animate-pulse" : "text-muted-foreground opacity-20"}`} />
            <h3 className="text-xl font-medium tracking-tight">
              {isAnalyzing ? "Processing Data..." : "Ready for Analysis"}
            </h3>
            <p className="text-muted-foreground max-w-md mt-2 font-mono text-sm">
              {isAnalyzing 
                ? "Synthesizing climatic, topographical, and zoning parameters. This requires extensive computation." 
                : "Trigger the engine to compile environmental and contextual data based on established coordinates."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Sun className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Climate & Sun</h4>
                    <p className="text-sm">{analysis.climate}. {analysis.sunExposure}.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Wind className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Wind Dynamics</h4>
                    <p className="text-sm">{analysis.windDirection}.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Mountain className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Topography & Soil</h4>
                    <p className="text-sm">{analysis.topography}. {analysis.soilType}.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Building2 className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Surrounding Context</h4>
                    <p className="text-sm">{analysis.surroundingContext}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Constraints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.constraints.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Sustainability Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold font-mono text-primary mb-2">{analysis.sustainabilityScore}</div>
                <p className="text-xs text-muted-foreground">/ 100 based on environmental factors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="text-sm border-l-2 border-primary/30 pl-3">
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {(analysis.zoningInfo || analysis.accessibilityNotes) && (
              <Card className="bg-muted/50">
                 <CardContent className="p-4 space-y-4">
                   {analysis.zoningInfo && (
                     <div>
                       <h5 className="font-mono text-xs text-muted-foreground mb-1 uppercase">Zoning</h5>
                       <p className="text-sm">{analysis.zoningInfo}</p>
                     </div>
                   )}
                   {analysis.accessibilityNotes && (
                     <div>
                       <h5 className="font-mono text-xs text-muted-foreground mb-1 uppercase">Access</h5>
                       <p className="text-sm">{analysis.accessibilityNotes}</p>
                     </div>
                   )}
                 </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

