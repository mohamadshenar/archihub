import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ProjectPersonality() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Analysis Complete",
      description: "Personality profile generated."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personality Analysis</h1>
          <p className="text-sm text-muted-foreground font-mono">Psychological and behavioral mapping.</p>
        </div>
        <Button onClick={handleAction}>
          <BrainCircuit className="w-4 h-4 mr-2" />
          Analyze Personality
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Psychometric Profiling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Introvert</span>
                <span>Extrovert</span>
              </div>
              <Slider defaultValue={[30]} max={100} step={1} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Formal</span>
                <span>Relaxed</span>
              </div>
              <Slider defaultValue={[75]} max={100} step={1} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Luxury</span>
                <span>Practical</span>
              </div>
              <Slider defaultValue={[60]} max={100} step={1} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Open Spaces</span>
                <span>Private Enclaves</span>
              </div>
              <Slider defaultValue={[40]} max={100} step={1} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Natural Light Need</span>
                <span className="font-mono">8/10</span>
              </div>
              <Slider defaultValue={[80]} max={100} step={1} />
            </div>
            <div className="space-y-3">
              <Label>Color Tolerance</Label>
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded flex items-center justify-center text-xs font-mono border-2 border-primary">Neutral</div>
                <div className="h-8 bg-amber-100 dark:bg-amber-900 rounded flex items-center justify-center text-xs font-mono opacity-50">Warm</div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-mono opacity-50">Cool</div>
                <div className="h-8 bg-red-500 rounded flex items-center justify-center text-xs font-mono text-white opacity-50">Bold</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifestyle Indicators</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="wfh" defaultChecked />
                <Label htmlFor="wfh" className="font-normal">Work from Home</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="entertain" />
                <Label htmlFor="entertain" className="font-normal">Entertainment Focus</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="kids" />
                <Label htmlFor="kids" className="font-normal">Child Friendly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="garden" defaultChecked />
                <Label htmlFor="garden" className="font-normal">Garden/Nature Lover</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="minimal" defaultChecked />
                <Label htmlFor="minimal" className="font-normal">Minimalist Habits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="tech" defaultChecked />
                <Label htmlFor="tech" className="font-normal">Tech Integrated</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Computed Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-bold mb-4">"The Quiet Minimalist"</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Introversion</span>
                    <span>70%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary w-[70%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Practicality</span>
                    <span>60%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary w-[60%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Nature Affinity</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary w-[85%]" /></div>
                </div>
              </div>

              <p className="text-sm mt-6 text-muted-foreground leading-relaxed">
                Design should prioritize retreat and contemplation. Emphasize acoustic separation, curated views to nature, and highly practical, low-maintenance finishes. Open plans should be avoided in favor of distinct, purposeful zones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
