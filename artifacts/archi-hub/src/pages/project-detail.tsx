import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  ProjectStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getTypeLabel, getStatusProgress } from "@/lib/project-utils";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  BrainCircuit, 
  ClipboardList, 
  LayoutTemplate, 
  Image as ImageIcon,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

const WORKFLOW_STEPS = [
  { id: "site", label: "Site Selection", path: "site", icon: MapPin, requiredStatus: ProjectStatus.draft },
  { id: "analysis", label: "AI Analysis", path: "analysis", icon: BrainCircuit, requiredStatus: ProjectStatus.site_selected },
  { id: "questionnaire", label: "Needs Questionnaire", path: "questionnaire", icon: ClipboardList, requiredStatus: ProjectStatus.analyzed },
  { id: "program", label: "Architectural Program", path: "program", icon: LayoutTemplate, requiredStatus: ProjectStatus.programmed }, // can be generated after questionnaire
  { id: "images", label: "Imagery Gallery", path: "images", icon: ImageIcon, requiredStatus: ProjectStatus.images_generated }
];

export default function ProjectDetail() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-20 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  const currentProgress = getStatusProgress(project.status);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Badge variant="outline" className="font-mono">{project.id}</Badge>
          <Badge className="font-mono">{getStatusLabel(project.status)}</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          {project.description || "No description provided for this project."}
        </p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-sm text-muted-foreground">Workflow Progress</span>
            <span className="font-mono font-bold text-primary">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2 rounded-none" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const stepStatusValue = getStatusProgress(step.requiredStatus);
          const isCompleted = currentProgress > stepStatusValue || project.status === step.requiredStatus && step.id === 'site' && project.latitude; // Simplified check
          const isCurrent = 
            (project.status === ProjectStatus.draft && step.id === "site") ||
            (project.status === ProjectStatus.site_selected && step.id === "analysis") ||
            (project.status === ProjectStatus.analyzed && step.id === "questionnaire") ||
            (project.status === ProjectStatus.programmed && step.id === "program" && !project.program) ||
            ((project.status === ProjectStatus.programmed || project.status === ProjectStatus.images_generated) && step.id === "images");
            
          const isLocked = !isCompleted && !isCurrent;

          return (
            <Link key={step.id} href={`/projects/${project.id}/${step.path}`}>
              <Card className={`h-full transition-all cursor-pointer border-l-4 ${
                isCurrent 
                  ? "border-l-primary bg-primary/5 hover:bg-primary/10" 
                  : isCompleted 
                    ? "border-l-muted-foreground/30 opacity-80 hover:opacity-100" 
                    : "border-l-transparent opacity-50 hover:opacity-70"
              }`}>
                <CardContent className="p-4 flex flex-col items-center text-center h-full justify-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                  ) : isCurrent ? (
                    <Clock className="w-8 h-8 text-primary animate-pulse" />
                  ) : (
                    <step.icon className="w-8 h-8 text-muted-foreground/50" />
                  )}
                  <span className="text-sm font-medium leading-tight">{step.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Typology</span>
                <span className="font-medium">{getTypeLabel(project.projectType)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Location</span>
                <span className="font-medium">{project.address || "Not set"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Site Area</span>
                <span className="font-medium">{project.siteArea ? `${project.siteArea} sqm` : "Not set"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Images Generated</span>
                <span className="font-medium font-mono">{project.imageCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Action</CardTitle>
          </CardHeader>
          <CardContent>
            {project.status === ProjectStatus.draft && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select a geographic site to begin analysis.</p>
                <Link href={`/projects/${project.id}/site`}>
                  <Button className="w-full">Locate Site <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            )}
            {project.status === ProjectStatus.site_selected && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Site established. Ready for AI context analysis.</p>
                <Link href={`/projects/${project.id}/analysis`}>
                  <Button className="w-full">Run Analysis <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            )}
            {project.status === ProjectStatus.analyzed && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Analysis complete. Define functional requirements.</p>
                <Link href={`/projects/${project.id}/questionnaire`}>
                  <Button className="w-full">Fill Questionnaire <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            )}
             {project.status === ProjectStatus.programmed && !project.program && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Requirements captured. Generate spatial program.</p>
                <Link href={`/projects/${project.id}/program`}>
                  <Button className="w-full">View Program <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            )}
            {(project.status === ProjectStatus.programmed || project.status === ProjectStatus.images_generated) && project.program && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Program defined. Generate architectural imagery.</p>
                <Link href={`/projects/${project.id}/images`}>
                  <Button className="w-full">Open Gallery <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
