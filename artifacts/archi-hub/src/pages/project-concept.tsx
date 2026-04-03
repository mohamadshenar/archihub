import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Layers, SplitSquareHorizontal, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
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
  const [selectedConcept, setSelectedConcept] = useState<number>(0);
  const [moodProfile] = useState({ industrial: 40, minimal: 80 });

  const handleSelectConcept = (idx: number) => {
    setSelectedConcept(idx);
    toast({
      title: `Concept ${String.fromCharCode(65 + idx)} Selected`,
      description: `"${CONCEPTS[idx].title}" is now the active design concept.`
    });
  };

  const handleCompare = () => {
    toast({
      title: "Comparison Mode",
      description: "Overlaying concept metrics side-by-side for evaluation."
    });
  };

  const handleMoodboard = () => {
    toast({
      title: "Moodboard Generated",
      description: "Reference imagery compiled from the selected concept palette."
    });
  };

  const handleGenerateNew = () => {
    toast({
      title: "Concept Generator Running",
      description: "AI agent is synthesising a new design direction from your brief..."
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
          <Button variant="outline" onClick={handleCompare}>
            <SplitSquareHorizontal className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button variant="outline" onClick={handleMoodboard}>
            <Layers className="w-4 h-4 mr-2" />
            Moodboard
          </Button>
          <Button onClick={handleGenerateNew}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Computed Mood Profile</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Active: {CONCEPTS[selectedConcept].title}
            </Badge>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Natural vs Industrial</span>
                <span>{moodProfile.industrial}% Industrial</span>
              </div>
              <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${100 - moodProfile.industrial}%` }} />
                <div className="h-full bg-slate-500" style={{ width: `${moodProfile.industrial}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Minimal vs Expressive</span>
                <span>{moodProfile.minimal}% Minimal</span>
              </div>
              <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-stone-300" style={{ width: `${moodProfile.minimal}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${100 - moodProfile.minimal}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CONCEPTS.map((concept, idx) => {
          const isSelected = selectedConcept === idx;
          return (
            <motion.div
              key={idx}
              animate={{ scale: isSelected ? 1 : 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className={`flex flex-col transition-all cursor-pointer h-full ${
                  isSelected
                    ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleSelectConcept(idx)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-muted-foreground">Option 0{idx + 1}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
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

                    <Button
                      className="w-full mt-4"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => { e.stopPropagation(); handleSelectConcept(idx); }}
                    >
                      {isSelected ? "✓ Selected Concept" : "Select Concept"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
