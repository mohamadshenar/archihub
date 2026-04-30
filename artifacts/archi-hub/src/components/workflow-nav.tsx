import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MISSIONS = [
  { path: "", label: "Overview" },
  { path: "site", label: "Site Selection" },
  { path: "analysis", label: "Site Analysis" },
  { path: "context", label: "Context Study" },
  { path: "brief", label: "Client Brief" },
  { path: "personality", label: "Personality Analysis" },
  { path: "program", label: "Program Generator" },
  { path: "zoning", label: "Zoning & Planning" },
  { path: "concept", label: "Concept Studio" },
  { path: "massing", label: "Massing Generator" },
  { path: "exterior", label: "Exterior Design" },
  { path: "interior", label: "Interior Design" },
  { path: "landscape", label: "Landscape Design" },
  { path: "sustainability", label: "Sustainability" },
  { path: "regulations", label: "Code & Regulations" },
  { path: "presentation", label: "Final Presentation" },
  { path: "export", label: "Export Files" },
];

interface WorkflowNavProps {
  projectId: number;
}

export function WorkflowNav({ projectId }: WorkflowNavProps) {
  const [location] = useLocation();

  const base = `/projects/${projectId}`;
  const currentSegment = location.replace(base, "").replace(/^\//, "");

  const currentIndex = MISSIONS.findIndex((m) => m.path === currentSegment);
  const prev = currentIndex > 0 ? MISSIONS[currentIndex - 1] : null;
  const next = currentIndex < MISSIONS.length - 1 ? MISSIONS[currentIndex + 1] : null;

  const makePath = (m: (typeof MISSIONS)[0]) =>
    m.path ? `${base}/${m.path}` : base;

  return (
    <div data-print-hide className="flex items-center justify-between pt-8 mt-8 border-t border-border">
      <div>
        {prev ? (
          <Link href={makePath(prev)}>
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              {prev.label}
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>

      <span className="text-xs font-mono text-muted-foreground">
        {currentIndex + 1} / {MISSIONS.length}
      </span>

      <div>
        {next ? (
          <Link href={makePath(next)}>
            <Button className="gap-2">
              Next: {next.label}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
