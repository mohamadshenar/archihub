import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trees, Download, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ProjectLandscape() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Agent Active",
      description: "Generating landscape integration..."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landscape Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Site integration and exterior programming.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleAction}>
            <Trees className="w-4 h-4 mr-2" />
            Generate Design
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2">
           <CardHeader>
             <CardTitle>Strategy & Integration</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border overflow-hidden relative">
               <ImageIcon className="w-8 h-8 text-muted-foreground/30 z-0" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                 <p className="text-white text-sm font-medium">Conceptual Landscape Diagram</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <h4 className="font-semibold text-sm mb-1 text-primary">Hardscape</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">Permeable pavers for parking zones. Swept concrete for primary pedestrian paths to match building plinth. Corten steel retaining walls to manage grade changes.</p>
               </div>
               <div>
                 <h4 className="font-semibold text-sm mb-1 text-primary">Softscape</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">Drought-tolerant native grasses in swales. Mature deciduous shade trees on the south and west elevations. Evergreen buffer on the north property line.</p>
               </div>
             </div>
           </CardContent>
         </Card>

         <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Performance Metrics</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs font-mono mb-1">
                   <span>Permeable Area</span>
                   <span className="text-green-500">65%</span>
                 </div>
                 <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 w-[65%]" />
                   <div className="h-full bg-muted w-[35%]" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-mono mb-1">
                   <span>Canopy Coverage (10yr)</span>
                   <span>40%</span>
                 </div>
                 <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-primary w-[40%]" />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className="bg-primary/5 border-primary/20">
             <CardContent className="p-4">
               <h4 className="font-bold text-sm mb-2 text-primary">Water Management Strategy</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">Bioswales integrated into parking islands capture 100% of surface runoff. Sub-surface cistern captures roof runoff for irrigation during dry months.</p>
             </CardContent>
           </Card>
         </div>
      </div>
    </motion.div>
  );
}
