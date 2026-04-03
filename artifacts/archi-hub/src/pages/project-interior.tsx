import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sofa, Palette, Download, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ProjectInterior() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Interior Agent Active",
      description: "Synthesizing interior styles..."
    });
  };

  const renderStyleCard = (name: string, desc: string, colors: string[], selected = false) => (
    <Card className={`overflow-hidden cursor-pointer transition-all ${selected ? 'border-primary' : 'hover:border-primary/50'}`}>
      <div className="h-24 w-full flex">
        {colors.map((c, i) => (
           <div key={i} className="h-full flex-1" style={{backgroundColor: c}}></div>
        ))}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-bold text-sm">{name}</h4>
          {selected && <Badge className="text-[10px] py-0 px-1 font-mono">SELECTED</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interior Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial aesthetics and FF&E coordination.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleAction}>
            <Sofa className="w-4 h-4 mr-2" />
            Generate Styles
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lobby" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-1">
          <TabsTrigger value="lobby" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Lobby</TabsTrigger>
          <TabsTrigger value="office" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Workspace</TabsTrigger>
          <TabsTrigger value="exhibition" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Exhibition</TabsTrigger>
          <TabsTrigger value="cafe" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Cafe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lobby" className="pt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Style Directions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderStyleCard(
                "Minimalist Industrial", 
                "Exposed services, polished concrete, sharp steel details.", 
                ["#1c1917", "#44403c", "#a8a29e", "#e7e5e4", "#ea580c"],
                true
              )}
              {renderStyleCard(
                "Warm Brutalism", 
                "Heavy board-formed concrete softened by rich timber elements.", 
                ["#292524", "#57534e", "#78716c", "#b45309", "#fcd34d"]
              )}
              {renderStyleCard(
                "High Contrast", 
                "Dramatic dark walls punctuated by stark white furniture.", 
                ["#0a0a0a", "#171717", "#404040", "#d4d4d8", "#fafafa"]
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Lighting Mood</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-4 bg-muted/30 rounded-lg border border-border">
                   <h4 className="font-semibold text-sm mb-1">Ambient: Dramatic Focus</h4>
                   <p className="text-xs text-muted-foreground">Low general ambient light (150 lux) with high-intensity, narrow-beam spotlights (500 lux) directed at key architectural features and reception desk.</p>
                 </div>
                 <div className="p-4 bg-muted/30 rounded-lg border border-border">
                   <h4 className="font-semibold text-sm mb-1">Color Temperature</h4>
                   <p className="text-xs text-muted-foreground">3000K (Warm White) to soften the industrial material palette.</p>
                 </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> FF&E Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                 <p><strong>Seating:</strong> Modular lounge seating in heavy textured fabrics (charcoal/rust) with low profiles to emphasize ceiling height.</p>
                 <p><strong>Desks/Tables:</strong> Custom blackened steel reception desk with integrated lighting.</p>
                 <p><strong>Acoustics:</strong> Slatted timber acoustic baffles suspended above seating areas to manage reverberation on hard surfaces.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
