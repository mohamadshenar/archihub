import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Sun, Wind, Droplets, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectSustainability() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Simulation Running",
      description: "Calculating environmental performance..."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sustainability Check</h1>
          <p className="text-sm text-muted-foreground font-mono">Environmental performance and resource efficiency.</p>
        </div>
        <Button onClick={handleAction}>
          <Leaf className="w-4 h-4 mr-2" />
          Run Climate Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 md:col-span-1">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-6xl font-bold text-primary mb-2">78</div>
            <p className="text-sm font-medium">BREEAM Excellent Target</p>
            <p className="text-xs text-muted-foreground text-center mt-4">Performance is above baseline, but daylighting needs optimization in core areas.</p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-sm">Daylight Autonomy</span>
                </div>
                <span className="font-mono text-sm">65%</span>
              </div>
              <Progress value={65} className="h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-sm">Natural Ventilation</span>
                </div>
                <span className="font-mono text-sm">40%</span>
              </div>
              <Progress value={40} className="h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-sm">Energy Efficiency</span>
                </div>
                <span className="font-mono text-sm">82%</span>
              </div>
              <Progress value={82} className="h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-sm">Water Efficiency</span>
                </div>
                <span className="font-mono text-sm">90%</span>
              </div>
              <Progress value={90} className="h-1.5" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "Increase skylight area over the central atrium by 15% to improve daylight autonomy in core spaces.",
              "Implement automated louvers on south-facing facade to reduce peak cooling loads.",
              "Specify low-carbon concrete mix (min 30% slag/fly ash) to reduce embodied carbon.",
              "Add greywater harvesting tank to basement level to supply irrigation and WCs."
            ].map((rec, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
          <Button className="w-full mt-6" variant="secondary" onClick={() => toast({ title: "Strategies Applied", description: "Optimization recommendations integrated into design parameters." })}>Apply Optimization Strategies</Button>
        </CardContent>
      </Card>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
