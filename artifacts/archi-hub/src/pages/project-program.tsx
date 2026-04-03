import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useGenerateProgram
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LayoutTemplate, ArrowRight, Loader2, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectProgram() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { mutate: generate, isPending: isGenerating } = useGenerateProgram();

  const handleGenerate = () => {
    generate(
      { id: projectId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({
            title: "Program Generated",
            description: "Architectural program compiled successfully."
          });
        }
      }
    );
  };

  if (isLoading) return <div className="p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!project) return <div>Not found</div>;

  const program = project.program;

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
            <h1 className="text-2xl font-bold tracking-tight">Architectural Program</h1>
            <p className="text-sm text-muted-foreground font-mono">Spatial and qualitative specification.</p>
          </div>
        </div>
        {!program && (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LayoutTemplate className="w-4 h-4 mr-2" />}
            Generate Program
          </Button>
        )}
        {program && (
          <Link href={`/projects/${projectId}/images`}>
            <Button variant="secondary">
              Generate Imagery <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {!program ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-24 text-center">
            <LayoutTemplate className={`w-16 h-16 mb-6 ${isGenerating ? "text-primary animate-pulse" : "text-muted-foreground opacity-20"}`} />
            <h3 className="text-xl font-medium tracking-tight">
              {isGenerating ? "Compiling Program..." : "Program Undefined"}
            </h3>
            <p className="text-muted-foreground max-w-md mt-2 font-mono text-sm">
              {isGenerating 
                ? "Synthesizing questionnaire inputs into spatial requirements and material palettes." 
                : "Execute the generative routine to translate questionnaire data into a concrete architectural program."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1 bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                <Maximize className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-mono text-muted-foreground uppercase">Total Area</span>
                <span className="text-3xl font-bold mt-1">{program.totalArea} <span className="text-sm font-normal text-muted-foreground">sqm</span></span>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Design Philosophy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-mono text-muted-foreground mb-1 uppercase">Direction</h4>
                  <p className="text-sm">{program.styleDirection}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground mb-1 uppercase">Principles</h4>
                    <ul className="text-sm space-y-1">
                      {program.designPrinciples.map((p, i) => <li key={i}>• {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground mb-1 uppercase">Materials</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {program.materialPalette.map((m, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs rounded-none border-primary/30 text-primary/80">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight mb-4">Spatial Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {program.spaces.map((space, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-base">{space.name}</CardTitle>
                    <Badge variant={space.priority === "essential" ? "default" : space.priority === "important" ? "secondary" : "outline"} className="text-[10px] uppercase font-mono tracking-wider rounded-none">
                      {space.priority}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex justify-between text-muted-foreground font-mono mb-3 border-b border-border/50 pb-2">
                      <span>QTY: {space.quantity}</span>
                      <span>{space.area} sqm</span>
                    </div>
                    <p className="line-clamp-3 text-muted-foreground">{space.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      <WorkflowNav projectId={projectId} />
    </div>
  );
}
