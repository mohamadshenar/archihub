import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Layers, SplitSquareHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const CONCEPTS = [
  {
    title: "The Anchored Frame",
    narrative: "A heavy concrete plinth grounds the structure, contrasting with a delicate, transparent upper volume. It expresses permanence below and ephemeral lightness above.",
    tags: ["Brutalist Base", "Glass Pavilion", "Structural Expression", "Dualism"],
    materials: ["#545454", "#8c8c8c", "#e5e7eb", "#8b5cf6", "#1e293b"],
  },
  {
    title: "Filtered Light",
    narrative: "A porous facade acts as an environmental filter, modulating harsh sunlight while creating dramatic interior shadow play. Mass is carved to follow solar angles.",
    tags: ["Parametric Louvers", "Solar Carving", "Chiaroscuro", "Monolithic"],
    materials: ["#b45309", "#d97706", "#fef3c7", "#171717", "#404040"],
  },
  {
    title: "Borrowed Landscape",
    narrative: "The building dissolves its boundaries, pulling the exterior landscape into deep interior courtyards. Roof planes extend to blur the threshold of enclosure.",
    tags: ["Biophilic", "Deep Overhangs", "Courtyard Typology", "Horizontal"],
    materials: ["#27272a", "#166534", "#4ade80", "#d4d4d8", "#78716c"],
  }
];

export default function ProjectConcept() {
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concept Studio</h1>
          <p className="text-sm text-muted-foreground font-mono">Narrative generation and stylistic direction.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => handleAction("Comparing concepts...")}>
            <SplitSquareHorizontal className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button variant="outline" onClick={() => handleAction("Generating moodboard...")}>
            <Layers className="w-4 h-4 mr-2" />
            Moodboard
          </Button>
          <Button onClick={() => handleAction("Running Concept Generator Agent...")}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Computed Mood Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Natural vs Industrial</span>
                <span>40% Industrial</span>
              </div>
              <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[60%]" />
                <div className="h-full bg-slate-500 w-[40%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Minimal vs Expressive</span>
                <span>80% Minimal</span>
              </div>
              <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-stone-300 w-[80%]" />
                <div className="h-full bg-amber-500 w-[20%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CONCEPTS.map((concept, idx) => (
          <Card key={idx} className="flex flex-col hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-muted-foreground">Option 0{idx + 1}</span>
              </div>
              <CardTitle className="text-xl">{concept.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {concept.narrative}
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {concept.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono uppercase bg-muted/50 text-muted-foreground border-0">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h4 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Palette Extract</h4>
                  <div className="flex h-6 rounded-md overflow-hidden">
                    {concept.materials.map((color, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <Button className="w-full mt-4" variant={idx === 0 ? "default" : "outline"} onClick={() => handleAction(`Concept 0${idx + 1} selected.`)}>
                  {idx === 0 ? "Selected Concept" : "Select Concept"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
