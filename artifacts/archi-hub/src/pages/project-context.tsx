import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Download, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectContext() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = (agent: string) => {
    toast({
      title: "Agent Initialized",
      description: `Running ${agent} analysis...`
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Context Study</h1>
            <p className="text-sm text-muted-foreground font-mono">Urban integration and socio-cultural fabric.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Context Analyst Agent — Ready
          </span>
          <Button variant="outline" onClick={() => handleAction("Report Generator")}>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={() => handleAction("Urban Analyst")}>
            <Map className="w-4 h-4 mr-2" />
            Analyze Context
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>SWOT Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-green-500">
                <h4 className="font-semibold text-green-500 mb-2">Strengths</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• High visibility corner plot</li>
                  <li>• Proximity to public transit</li>
                  <li>• Mature trees on perimeter</li>
                </ul>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-red-500">
                <h4 className="font-semibold text-red-500 mb-2">Weaknesses</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• High ambient noise levels</li>
                  <li>• Irregular plot geometry</li>
                  <li>• Poor soil bearing capacity</li>
                </ul>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-blue-500">
                <h4 className="font-semibold text-blue-500 mb-2">Opportunities</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Pending rezoning to higher density</li>
                  <li>• Neighborhood gentrification</li>
                  <li>• Potential for district heating tie-in</li>
                </ul>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-orange-500">
                <h4 className="font-semibold text-orange-500 mb-2">Threats</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Changing flood plain regulations</li>
                  <li>• Shadow from proposed adjacent tower</li>
                  <li>• Volatile material costs in region</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Urban Fabric</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Grid-based street network with predominantly mid-rise commercial blocks. High pedestrian footfall during business hours. Mixed material palette of masonry and glass.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Building Heights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-16 w-full">
                <div className="bg-muted w-1/5 h-3/5 rounded-t"></div>
                <div className="bg-muted w-1/5 h-4/5 rounded-t"></div>
                <div className="bg-primary/50 w-1/5 h-full rounded-t flex items-end justify-center pb-1"><span className="text-[10px] font-mono">SITE</span></div>
                <div className="bg-muted w-1/5 h-2/5 rounded-t"></div>
                <div className="bg-muted w-1/5 h-5/5 rounded-t"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center font-mono">Contextual Skyline Profile</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-muted-foreground uppercase tracking-wider font-mono">Cultural Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Historically an industrial district, currently transitioning to creative workspaces and lofts. Strong community emphasis on preserving industrial heritage and exposed structures.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
