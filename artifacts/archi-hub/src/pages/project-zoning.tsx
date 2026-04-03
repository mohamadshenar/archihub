import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, GitMerge, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProjectZoning() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = (type: string) => {
    toast({
      title: "Agent Executing",
      description: `Running ${type} optimization...`
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zoning & Planning</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial organization and adjacencies.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => handleAction("Circulation")}>
            <GitMerge className="w-4 h-4 mr-2" />
            Show Circulation
          </Button>
          <Button onClick={() => handleAction("Bubble Diagram")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Generate Diagram
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Zone Taxonomy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded mt-1 shrink-0 bg-blue-500/80 border border-blue-500"></div>
              <div>
                <h4 className="text-sm font-semibold">Public Zone</h4>
                <p className="text-xs text-muted-foreground">High traffic, unrestricted access. Lobbies, galleries.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded mt-1 shrink-0 bg-amber-500/80 border border-amber-500"></div>
              <div>
                <h4 className="text-sm font-semibold">Semi-Public Buffer</h4>
                <p className="text-xs text-muted-foreground">Controlled access, meeting rooms, lounges.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded mt-1 shrink-0 bg-emerald-500/80 border border-emerald-500"></div>
              <div>
                <h4 className="text-sm font-semibold">Private Core</h4>
                <p className="text-xs text-muted-foreground">Restricted, secure. Offices, residential.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded mt-1 shrink-0 bg-slate-500/80 border border-slate-500"></div>
              <div>
                <h4 className="text-sm font-semibold">Service</h4>
                <p className="text-xs text-muted-foreground">MEP, loading, storage, BOH.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 min-h-[400px] flex items-center justify-center bg-card/50 relative overflow-hidden border-border/50">
          {/* Abstract Bubble Diagram using SVG */}
          <svg viewBox="0 0 800 500" className="w-full h-full opacity-80">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Connections */}
            <path d="M 250 250 L 400 200 L 550 250 L 400 350 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="opacity-20" />
            <path d="M 150 150 L 250 250" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
            <path d="M 650 150 L 550 250" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
            
            {/* Bubbles */}
            <g transform="translate(400, 200)">
              <circle r="70" className="fill-blue-500/20 stroke-blue-500" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" y="5" className="text-sm font-mono fill-current">LOBBY</text>
            </g>

            <g transform="translate(250, 250)">
              <circle r="80" className="fill-amber-500/20 stroke-amber-500" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" y="5" className="text-sm font-mono fill-current">EXHIBITION</text>
            </g>

            <g transform="translate(550, 250)">
              <circle r="60" className="fill-emerald-500/20 stroke-emerald-500" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" y="5" className="text-sm font-mono fill-current">OFFICES</text>
            </g>

            <g transform="translate(400, 350)">
              <circle r="50" className="fill-slate-500/20 stroke-slate-500" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" y="5" className="text-sm font-mono fill-current">LOADING</text>
            </g>

            <g transform="translate(150, 150)">
              <circle r="40" className="fill-blue-500/20 stroke-blue-500" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" y="5" className="text-[10px] font-mono fill-current">CAFE</text>
            </g>
          </svg>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjacency Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Space</TableHead>
                <TableHead>Lobby</TableHead>
                <TableHead>Exhibition</TableHead>
                <TableHead>Offices</TableHead>
                <TableHead>Loading</TableHead>
                <TableHead>Cafe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Lobby</TableCell>
                <TableCell className="bg-muted/30">-</TableCell>
                <TableCell className="text-primary font-bold">Strong</TableCell>
                <TableCell className="text-muted-foreground">Medium</TableCell>
                <TableCell className="text-destructive">Avoid</TableCell>
                <TableCell className="text-primary font-bold">Strong</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exhibition</TableCell>
                <TableCell className="text-primary font-bold">Strong</TableCell>
                <TableCell className="bg-muted/30">-</TableCell>
                <TableCell className="text-destructive">Avoid</TableCell>
                <TableCell className="text-primary font-bold">Strong</TableCell>
                <TableCell className="text-muted-foreground">Medium</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Offices</TableCell>
                <TableCell className="text-muted-foreground">Medium</TableCell>
                <TableCell className="text-destructive">Avoid</TableCell>
                <TableCell className="bg-muted/30">-</TableCell>
                <TableCell className="text-muted-foreground">Medium</TableCell>
                <TableCell className="text-muted-foreground">Medium</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
