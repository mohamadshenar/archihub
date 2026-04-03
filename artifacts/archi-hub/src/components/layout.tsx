import { Link, useLocation } from "wouter";
import { 
  Building2, 
  LayoutDashboard, 
  Settings, 
  FolderOpen,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Archi Hub</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/projects/new">
            <Button className="w-full justify-start gap-2" variant="default">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
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
