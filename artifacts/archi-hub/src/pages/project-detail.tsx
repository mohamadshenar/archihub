import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  ProjectStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getTypeLabel, getStatusProgress } from "@/lib/project-utils";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Map,
  Compass,
  Activity,
  ClipboardList,
  User,
  LayoutTemplate,
  Grid3X3,
  Lightbulb,
  Box,
  Building2,
  Sofa,
  Trees,
  Leaf,
  FileText,
  DollarSign,
  Presentation,
  Download
} from "lucide-react";
import { motion } from "framer-motion";

const PHASES = [
  {
    name: "Phase 1: Discovery",
    steps: [
      { id: "site", label: "Site Selection", path: "site", icon: Compass, requiredStatus: ProjectStatus.draft },
      { id: "analysis", label: "Site Analysis", path: "analysis", icon: Activity, requiredStatus: ProjectStatus.site_selected },
      { id: "context", label: "Context Study", path: "context", icon: Map, requiredStatus: ProjectStatus.analyzed }
    ]
  },
  {
    name: "Phase 2: Client",
    steps: [
      { id: "brief", label: "Client Brief", path: "brief", icon: ClipboardList, requiredStatus: ProjectStatus.analyzed },
      { id: "personality", label: "Personality Analysis", path: "personality", icon: User, requiredStatus: ProjectStatus.analyzed }
    ]
  },
  {
    name: "Phase 3: Intelligence",
    steps: [
      { id: "program", label: "Program Generator", path: "program", icon: LayoutTemplate, requiredStatus: ProjectStatus.programmed },
      { id: "zoning", label: "Zoning & Planning", path: "zoning", icon: Grid3X3, requiredStatus: ProjectStatus.programmed }
    ]
  },
  {
    name: "Phase 4: Design",
    steps: [
      { id: "concept", label: "Concept Studio", path: "concept", icon: Lightbulb, requiredStatus: ProjectStatus.programmed },
      { id: "massing", label: "Massing Generator", path: "massing", icon: Box, requiredStatus: ProjectStatus.programmed },
      { id: "exterior", label: "Exterior Design", path: "exterior", icon: Building2, requiredStatus: ProjectStatus.programmed },
      { id: "interior", label: "Interior Design", path: "interior", icon: Sofa, requiredStatus: ProjectStatus.programmed },
      { id: "landscape", label: "Landscape Design", path: "landscape", icon: Trees, requiredStatus: ProjectStatus.programmed }
    ]
  },
  {
    name: "Phase 5: Evaluation",
    steps: [
      { id: "sustainability", label: "Sustainability", path: "sustainability", icon: Leaf, requiredStatus: ProjectStatus.images_generated },
      { id: "regulations", label: "Code & Regulations", path: "regulations", icon: FileText, requiredStatus: ProjectStatus.images_generated },
      { id: "cost", label: "Cost Estimate", path: "cost", icon: DollarSign, requiredStatus: ProjectStatus.images_generated }
    ]
  },
  {
    name: "Phase 6: Presentation",
    steps: [
      { id: "presentation", label: "Final Presentation", path: "presentation", icon: Presentation, requiredStatus: ProjectStatus.images_generated },
      { id: "export", label: "Export Files", path: "export", icon: Download, requiredStatus: ProjectStatus.images_generated }
    ]
  }
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-sm text-muted-foreground">Workflow Progress</span>
              <span className="font-mono font-bold text-primary">{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-2 rounded-none" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Next Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/projects/${project.id}/site`}>
              <Button className="w-full">Continue Workflow <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </CardContent>
        </Card>
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
                <span className="text-muted-foreground block mb-1">Number of Floors</span>
                <span className="font-medium font-mono">{project.numFloors ?? "Not set"}</span>
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
      </div>

      <div className="space-y-12">
        <h2 className="text-2xl font-bold tracking-tight">Mission Control</h2>
        {PHASES.map((phase, i) => (
          <div key={i} className="space-y-4">
            <h3 className="font-semibold text-muted-foreground font-mono text-sm uppercase tracking-wider">{phase.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {phase.steps.map((step) => {
                const stepStatusValue = getStatusProgress(step.requiredStatus);
                const isCompleted = currentProgress > stepStatusValue;
                const isCurrent = currentProgress === stepStatusValue;

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
          </div>
        ))}
      </div>
    </motion.div>
  );
}
