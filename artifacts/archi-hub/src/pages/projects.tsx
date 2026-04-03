import { useState } from "react";
import { Link } from "wouter";
import { 
  useListProjects, 
  getListProjectsQueryKey,
  ProjectProjectType,
  ProjectStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MapPin, Building2, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { getStatusLabel, getTypeLabel } from "@/lib/project-utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectsList() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  const { data: projects, isLoading } = useListProjects({
    query: { queryKey: getListProjectsQueryKey() }
  });

  const filteredProjects = projects?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === "all" || p.projectType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">Manage architectural portfolios.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Tabs value={filterType} onValueChange={setFilterType} className="w-full md:w-auto overflow-x-auto">
          <TabsList className="bg-muted/50 rounded-md">
            <TabsTrigger value="all" className="font-mono text-xs uppercase">All</TabsTrigger>
            <TabsTrigger value={ProjectProjectType.residential} className="font-mono text-xs uppercase">Residential</TabsTrigger>
            <TabsTrigger value={ProjectProjectType.commercial} className="font-mono text-xs uppercase">Commercial</TabsTrigger>
            <TabsTrigger value={ProjectProjectType.cultural} className="font-mono text-xs uppercase">Cultural</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-6">
              {search || filterType !== "all" ? "Try adjusting your search query or filters." : "Start by creating a new architectural project."}
            </p>
            {!search && filterType === "all" && (
              <Link href="/projects/new">
                <Button variant="outline">Create Project</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full hover:border-primary/50 transition-colors flex flex-col group bg-card">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={project.status === ProjectStatus.complete ? "default" : "secondary"} className={`font-mono text-[10px] uppercase ${project.status !== ProjectStatus.complete ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase text-muted-foreground border-border">
                      {getTypeLabel(project.projectType)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-4 pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{project.address || "Location not set"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                      {project.siteArea && (
                        <span className="font-mono text-xs">{project.siteArea} sqm</span>
                      )}
                    </div>
                  </div>
                  
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Open Project <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
