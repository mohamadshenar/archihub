import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, Compass, Rotate3D, Maximize, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Badge } from "@/components/ui/badge";

type OptionKey = "A" | "B" | "C";

const OPTIONS: { key: OptionKey; gfa: string; floors: string; coverage: string; height: string }[] = [
  { key: "A", gfa: "4,200 m²", floors: "6", coverage: "65%", height: "24m" },
  { key: "B", gfa: "4,050 m²", floors: "8", coverage: "45%", height: "32m" },
  { key: "C", gfa: "4,300 m²", floors: "4 & 5", coverage: "75%", height: "20m" },
];

export default function ProjectMassing() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<OptionKey>("A");

  const handleSelectOption = (key: OptionKey) => {
    setSelectedOption(key);
    const opt = OPTIONS.find(o => o.key === key)!;
    toast({
      title: `Option ${key} Selected`,
      description: `${opt.gfa} GFA · ${opt.floors} floors · ${opt.height} height.`
    });
  };

  const handleCompare = () => {
    toast({
      title: "Comparison Mode",
      description: "Overlaying massing metrics across all three options."
    });
  };

  const handleGenerateIterations = () => {
    toast({
      title: "Massing Agent Running",
      description: "Generating new volumetric iterations based on FAR constraints..."
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
          <Button variant="outline" onClick={handleCompare}>
            <Maximize className="w-4 h-4 mr-2" />
            Compare Data
          </Button>
          <Button onClick={handleGenerateIterations}>
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
          {OPTIONS.map((opt) => {
            const isSelected = selectedOption === opt.key;
            return (
              <motion.div
                key={opt.key}
                animate={{ scale: isSelected ? 1 : 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={`flex flex-col cursor-pointer transition-all h-full ${
                    isSelected
                      ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectOption(opt.key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant={isSelected ? "default" : "outline"}>Option {opt.key}</Badge>
                      {isSelected && (
                        <span className="text-xs font-mono text-primary font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SELECTED
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <div className="h-48 bg-black/20 flex items-center justify-center relative overflow-hidden">
                      <Rotate3D className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/50" />
                      {opt.key === "A" && (
                        <svg viewBox="0 0 200 200" className={`w-32 h-32 transition-opacity ${isSelected ? "opacity-100" : "opacity-50"}`}>
                          <path d="M 100 50 L 150 75 L 150 150 L 100 175 L 50 150 L 50 75 Z" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="1" />
                          <path d="M 100 50 L 100 100 L 150 125 M 100 100 L 50 125" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1" />
                          <path d="M 100 20 L 150 45 L 150 75 L 100 100 L 50 75 L 50 45 Z" fill="currentColor" className="text-primary/40" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                      {opt.key === "B" && (
                        <svg viewBox="0 0 200 200" className={`w-32 h-32 transition-opacity ${isSelected ? "opacity-100" : "opacity-50"}`}>
                          <path d="M 100 30 L 130 45 L 130 160 L 100 175 L 70 160 L 70 45 Z" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="1" />
                          <path d="M 100 30 L 100 60 L 130 75 M 100 60 L 70 75" fill="none" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1" />
                        </svg>
                      )}
                      {opt.key === "C" && (
                        <svg viewBox="0 0 200 200" className={`w-32 h-32 transition-opacity ${isSelected ? "opacity-100" : "opacity-50"}`}>
                          <path d="M 70 70 L 100 85 L 100 150 L 70 165 L 40 150 L 40 85 Z" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="1" />
                          <path d="M 130 50 L 160 65 L 160 130 L 130 145 L 100 130 L 100 65 Z" fill="currentColor" className="text-muted-foreground/30" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono border-t border-border pt-3">
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase">GFA</span>
                          <span>{opt.gfa}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase">Floors</span>
                          <span>{opt.floors}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase">Coverage</span>
                          <span>{opt.coverage}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase">Height</span>
                          <span>{opt.height}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
