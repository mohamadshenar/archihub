import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, Compass, Rotate3D, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Badge } from "@/components/ui/badge";

export default function ProjectMassing() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = (msg: string) => {
    toast({
      title: "Agent Executing",
      description: msg
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Massing Generator</h1>
          <p className="text-sm text-muted-foreground font-mono">Volumetric exploration and FAR optimization.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => handleAction("Comparing volumes...")}>
            <Maximize className="w-4 h-4 mr-2" />
            Compare Data
          </Button>
          <Button onClick={() => handleAction("Running Massing Agent...")}>
            <Box className="w-4 h-4 mr-2" />
            Generate Iterations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4" /> Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative w-32 h-32 rounded-full border-2 border-border flex items-center justify-center">
              <span className="absolute top-2 text-xs font-mono font-bold text-muted-foreground">N</span>
              <span className="absolute bottom-2 text-xs font-mono font-bold text-muted-foreground">S</span>
              <span className="absolute left-2 text-xs font-mono font-bold text-muted-foreground">W</span>
              <span className="absolute right-2 text-xs font-mono font-bold text-muted-foreground">E</span>
              {/* Sun Path Arc */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 0 1 80 80" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="80" cy="80" r="4" className="fill-primary" />
                <circle cx="20" cy="80" r="4" className="fill-primary opacity-50" />
              </svg>
              <div className="w-8 h-8 bg-muted border-2 border-primary rotate-45"></div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6">Optimal orientation: 15° East of South for solar gain.</p>
          </CardContent>
        </Card>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option A */}
          <Card className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer border-primary">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="default">Option A</Badge>
                <span className="text-xs font-mono text-primary font-bold">SELECTED</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="h-48 bg-black/20 flex items-center justify-center relative overflow-hidden">
                <Rotate3D className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/50" />
                <svg viewBox="0 0 200 200" className="w-32 h-32 opacity-80">
                  <path d="M 100 50 L 150 75 L 150 150 L 100 175 L 50 150 L 50 75 Z" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="1" />
                  <path d="M 100 50 L 100 100 L 150 125 M 100 100 L 50 125" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1" />
                  <path d="M 100 20 L 150 45 L 150 75 L 100 100 L 50 75 L 50 45 Z" fill="currentColor" className="text-primary/40" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono border-t border-border pt-3">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">GFA</span>
                    <span>4,200 m²</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Floors</span>
                    <span>6</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Coverage</span>
                    <span>65%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Height</span>
                    <span>24m</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option B */}
          <Card className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline">Option B</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="h-48 bg-black/20 flex items-center justify-center relative overflow-hidden">
                <Rotate3D className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/50" />
                <svg viewBox="0 0 200 200" className="w-32 h-32 opacity-50">
                  {/* Taller, thinner massing */}
                  <path d="M 100 30 L 130 45 L 130 160 L 100 175 L 70 160 L 70 45 Z" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="1" />
                  <path d="M 100 30 L 100 60 L 130 75 M 100 60 L 70 75" fill="none" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1" />
                </svg>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono border-t border-border pt-3">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">GFA</span>
                    <span>4,050 m²</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Floors</span>
                    <span>8</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Coverage</span>
                    <span>45%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Height</span>
                    <span>32m</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option C */}
          <Card className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline">Option C</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="h-48 bg-black/20 flex items-center justify-center relative overflow-hidden">
                <Rotate3D className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/50" />
                <svg viewBox="0 0 200 200" className="w-32 h-32 opacity-50">
                  {/* Split massing */}
                  <path d="M 70 70 L 100 85 L 100 150 L 70 165 L 40 150 L 40 85 Z" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="1" />
                  <path d="M 130 50 L 160 65 L 160 130 L 130 145 L 100 130 L 100 65 Z" fill="currentColor" className="text-muted-foreground/30" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono border-t border-border pt-3">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">GFA</span>
                    <span>4,300 m²</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Floors</span>
                    <span>4 & 5</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Coverage</span>
                    <span>75%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Height</span>
                    <span>20m</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
