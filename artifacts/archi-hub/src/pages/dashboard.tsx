import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetRecentProjects,
  getGetRecentProjectsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FolderOpen, Image as ImageIcon, Activity, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ProjectProjectType, ProjectStatus } from "@workspace/api-client-react";
import { getStatusLabel, getTypeLabel } from "@/lib/project-utils";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: recentProjects, isLoading: isLoadingRecent } = useGetRecentProjects({
    query: { queryKey: getGetRecentProjectsQueryKey() }
  });

  if (isLoadingSummary || isLoadingRecent) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Dashboard</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">System status normal. Welcome back.</p>
        </div>
        <div className="text-right max-w-sm">
          <p className="italic text-sm text-muted-foreground">"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</p>
          <p className="text-xs font-mono mt-2 uppercase tracking-wider">— Le Corbusier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalProjects}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {(summary.projectsByStatus?.[ProjectStatus.site_selected] || 0) + 
                 (summary.projectsByStatus?.[ProjectStatus.analyzed] || 0) +
                 (summary.projectsByStatus?.[ProjectStatus.programmed] || 0)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.projectsByStatus?.[ProjectStatus.complete] || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Generated Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalImages}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Agents Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Design Agents</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {["Site Agent", "Concept Agent", "Exterior Agent", "Interior Agent", "Landscape Agent", "Visualization Agent"].map((agent, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full gap-2">
                <span className="font-semibold text-sm">{agent}</span>
                <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Phase Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { name: "Discovery", count: summary.projectsByStatus?.[ProjectStatus.draft] || 0 },
              { name: "Client", count: summary.projectsByStatus?.[ProjectStatus.site_selected] || 0 },
              { name: "Intelligence", count: summary.projectsByStatus?.[ProjectStatus.analyzed] || 0 },
              { name: "Design", count: summary.projectsByStatus?.[ProjectStatus.programmed] || 0 },
              { name: "Evaluation", count: 0 },
              { name: "Presentation", count: summary.projectsByStatus?.[ProjectStatus.images_generated] || 0 }
            ].map((phase, i) => (
              <div key={i} className="p-3 border border-border bg-muted/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary mb-1">{phase.count}</div>
                <div className="text-xs font-mono uppercase text-muted-foreground">{phase.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects && recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group bg-card">
                        <div className="space-y-1">
                          <h4 className="font-medium group-hover:text-primary transition-colors">{project.name}</h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.address || "No location"}</span>
                            <span>{getTypeLabel(project.projectType)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={
                            project.status === ProjectStatus.complete ? "border-green-500/50 text-green-500 bg-green-500/10" : 
                            project.status === ProjectStatus.draft ? "border-muted-foreground/30 text-muted-foreground" :
                            "border-primary/50 text-primary bg-primary/10"
                          }>{getStatusLabel(project.status)}</Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -ml-2" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground font-mono">No recent projects detected.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Projects by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.projectsByType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getTypeLabel(type as ProjectProjectType)}</span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{count}</span>
                  </div>
                ))}
                {Object.keys(summary.projectsByType || {}).length === 0 && (
                  <div className="text-sm text-muted-foreground font-mono">No data available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
