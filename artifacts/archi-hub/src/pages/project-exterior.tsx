import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectExterior() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Exterior Agent Active",
      description: "Generating facade articulation options..."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exterior Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Facade articulation and envelope detailing.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleAction}>
            <Building2 className="w-4 h-4 mr-2" />
            Generate Facades
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Material Assembly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
              <div className="w-16 h-16 rounded bg-stone-300 shadow-inner shrink-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 20 20\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"%239C92AC\\" fill-opacity=\\"0.4\\" fill-rule=\\"evenodd\\"%3E%3Ccircle cx=\\"3\\" cy=\\"3\\" r=\\"3\\"/>%3Ccircle cx=\\"13\\" cy=\\"13\\" r=\\"3\\"/>%3C/g%3E%3C/svg%3E")' }}></div>
              <div>
                <h4 className="font-semibold text-sm">Primary: Architectural Concrete</h4>
                <p className="text-xs text-muted-foreground">Board-formed finish, light grey. Structural integrity and brutalist aesthetic.</p>
              </div>
            </div>
            
            <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
              <div className="w-16 h-16 rounded bg-amber-800 shadow-inner shrink-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"10\\" height=\\"10\\" viewBox=\\"0 0 10 10\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cpath d=\\"M0 0h10v10H0V0zm2 2h6v6H2V2z\\" fill=\\"%23000000\\" fill-opacity=\\"0.1\\" fill-rule=\\"evenodd\\"%3E%3C/path%3E%3C/svg%3E")' }}></div>
              <div>
                <h4 className="font-semibold text-sm">Secondary: Corten Steel</h4>
                <p className="text-xs text-muted-foreground">Weathered finish, warm rust. Used for louvers and window surrounds.</p>
              </div>
            </div>

            <div className="p-4 border border-border/50 bg-card rounded-lg flex items-center gap-4">
              <div className="w-16 h-16 rounded bg-slate-200 shadow-inner shrink-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-sky-200/50 to-transparent"></div>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Glazing: Low-E Glass</h4>
                <p className="text-xs text-muted-foreground">Double-glazed, argon filled. Neutral tint to maximize daylight penetration.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Facade Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Window-to-Wall Ratio</span>
                  <span>42%</span>
                </div>
                <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[42%]" />
                  <div className="h-full bg-muted w-[58%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Thermal Resistance (R-Value)</span>
                  <span>Target Met</span>
                </div>
                <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[100%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 overflow-hidden border-primary/20">
            <div className="aspect-video bg-black/40 flex items-center justify-center relative p-6">
               <Layers className="absolute text-primary/20 w-32 h-32 pointer-events-none" />
               <div className="relative z-10 text-center">
                 <h3 className="font-bold mb-2">Facade Articulation Agent</h3>
                 <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">The agent recommends deep overhangs on the south elevation to mitigate solar gain while maximizing transparent areas on the north facade.</p>
                 <Button size="sm" variant="secondary">Apply Recommendations</Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
