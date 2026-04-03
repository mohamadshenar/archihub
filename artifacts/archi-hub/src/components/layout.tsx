import { Link, useLocation, useParams } from "wouter";
import { 
  Building2, 
  LayoutDashboard, 
  FolderOpen,
  Plus,
  MapPin,
  Compass,
  Activity,
  Map as MapIcon,
  ClipboardList,
  User,
  LayoutTemplate,
  Grid3X3,
  Lightbulb,
  Box,
  Sofa,
  Trees,
  Leaf,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Presentation,
  Download,
  Search,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetProject, ProjectStatus } from "@workspace/api-client-react";

export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderOpen },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Archi Hub</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <Link href="/projects/new">
            <Button className="w-full justify-start gap-2" variant="default">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarFallback className="bg-primary/20 text-primary rounded-md">AH</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Architect</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto p-6 md:p-8 lg:p-12 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

const MISSION_ITEMS = [
  { path: "", label: "Overview", icon: MapPin },
  { path: "site", label: "Site Selection", icon: Compass },
  { path: "analysis", label: "Site Analysis", icon: Activity },
  { path: "context", label: "Context Study", icon: MapIcon },
  { path: "brief", label: "Client Brief", icon: ClipboardList },
  { path: "personality", label: "Personality Analysis", icon: User },
  { path: "program", label: "Program Generator", icon: LayoutTemplate },
  { path: "zoning", label: "Zoning & Planning", icon: Grid3X3 },
  { path: "concept", label: "Concept Studio", icon: Lightbulb },
  { path: "massing", label: "Massing Generator", icon: Box },
  { path: "exterior", label: "Exterior Design", icon: Building2 },
  { path: "interior", label: "Interior Design", icon: Sofa },
  { path: "landscape", label: "Landscape Design", icon: Trees },
  { path: "sustainability", label: "Sustainability", icon: Leaf },
  { path: "regulations", label: "Code & Regulations", icon: FileText },
  { path: "cost", label: "Cost Estimate", icon: DollarSign },
  { path: "visualization", label: "Visualization Studio", icon: ImageIcon },
  { path: "presentation", label: "Final Presentation", icon: Presentation },
  { path: "export", label: "Export Files", icon: Download },
];

export function ProjectLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const params = useParams();
  const projectId = parseInt(params.id || "0");

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId }
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
        <div className="p-6 flex items-center gap-3 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
            <div className="bg-primary/10 p-2 rounded text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">Archi Hub</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {MISSION_ITEMS.map((item, index) => {
            const itemPath = `/projects/${projectId}${item.path ? `/${item.path}` : ""}`;
            const isActive = location === itemPath;
            
            // Fake status logic for MVP
            const isComplete = index < 3;
            const isInProgress = index === 3;

            return (
              <Link key={item.path} href={itemPath}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{item.label}</span>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isComplete ? 'bg-green-500' : isInProgress ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg">{project?.name || "Loading Project..."}</h2>
            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">ID: {projectId}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar className="h-8 w-8 rounded-md border border-border">
              <AvatarFallback className="bg-primary/20 text-primary rounded-md text-xs">AH</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
