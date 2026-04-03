import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation, Maximize, Play, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectPresentation() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleBuildBoard = () => {
    toast({
      title: "Building Presentation Board",
      description: "Compiling all project assets into curated presentation layout..."
    });
  };

  const handleSlideshow = () => {
    toast({
      title: "Slideshow Mode",
      description: "Entering full-screen presentation mode..."
    });
  };

  const handleFullscreen = () => {
    toast({
      title: "Fullscreen",
      description: "Opening board in fullscreen view..."
    });
  };

  const handleDownload = () => {
    toast({
      title: "Downloading Board",
      description: "Packaging presentation board as high-resolution PDF..."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Final Presentation</h1>
          <p className="text-sm text-muted-foreground font-mono">Curated layout of all project intelligence.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSlideshow}>
            <Play className="w-4 h-4 mr-2" />
            Slideshow
          </Button>
          <Button onClick={handleBuildBoard}>
            <Presentation className="w-4 h-4 mr-2" />
            Build Board
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border p-8 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2">
           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleFullscreen}><Maximize className="w-4 h-4" /></Button>
           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="border-b-4 border-primary pb-6">
            <h2 className="text-4xl font-bold mb-2">URBAN CULTURAL CENTER</h2>
            <div className="flex gap-6 font-mono text-sm text-muted-foreground uppercase">
              <span>New York, NY</span>
              <span>4,200 sqm</span>
              <span>Concept Phase</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-12 md:col-span-4 space-y-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Project Narrative</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A heavy concrete plinth grounds the structure, contrasting with a delicate, transparent upper volume. It expresses permanence below and ephemeral lightness above, responding to the historic industrial context while looking towards a progressive future.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Site Intelligence</h3>
                <ul className="text-xs font-mono space-y-2 text-muted-foreground">
                  <li className="flex justify-between border-b border-border/50 pb-1"><span>Orientation</span> <span className="text-foreground">Optimal</span></li>
                  <li className="flex justify-between border-b border-border/50 pb-1"><span>Sun Exposure</span> <span className="text-foreground">High</span></li>
                  <li className="flex justify-between border-b border-border/50 pb-1"><span>Urban Density</span> <span className="text-foreground">High</span></li>
                  <li className="flex justify-between pb-1"><span>Zoning</span> <span className="text-foreground">Compliant</span></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Materiality</h3>
                <div className="flex h-8 w-full rounded overflow-hidden">
                  {["#545454", "#8c8c8c", "#e5e7eb", "#8b5cf6", "#1e293b"].map((c, i) => (
                    <div key={i} className="flex-1" style={{backgroundColor: c}}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Images */}
            <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
              <div className="col-span-2 aspect-video bg-muted relative rounded-md overflow-hidden flex items-center justify-center border border-border">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                <span className="absolute bottom-2 left-3 text-[10px] font-mono uppercase bg-black/50 px-2 py-1 rounded text-white">Hero Exterior Render</span>
              </div>
              <div className="aspect-square bg-muted relative rounded-md overflow-hidden flex items-center justify-center border border-border">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                <span className="absolute bottom-2 left-3 text-[10px] font-mono uppercase bg-black/50 px-2 py-1 rounded text-white">Lobby Interior</span>
              </div>
              <div className="aspect-square bg-muted relative rounded-md overflow-hidden flex items-center justify-center border border-border">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                <span className="absolute bottom-2 left-3 text-[10px] font-mono uppercase bg-black/50 px-2 py-1 rounded text-white">Massing Diagram</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
