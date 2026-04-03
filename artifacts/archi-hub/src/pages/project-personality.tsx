import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, BrainCircuit, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useProjectMission } from "@/hooks/use-project-mission";
import { WorkflowNav } from "@/components/workflow-nav";

const LIFESTYLE_OPTS = [
  { id: "wfh", label: "Work from Home" },
  { id: "entertain", label: "Entertainment Focus" },
  { id: "kids", label: "Child Friendly" },
  { id: "garden", label: "Garden / Nature Lover" },
  { id: "minimal", label: "Minimalist Habits" },
  { id: "tech", label: "Tech Integrated" },
];

const COLOR_OPTS = ["Neutral", "Warm", "Cool", "Bold"];

interface PersonalityData {
  introvert: number;
  formal: number;
  luxury: number;
  openSpaces: number;
  naturalLight: number;
  colorPreference: string;
  lifestyle: string[];
}

const DEFAULT: PersonalityData = {
  introvert: 30,
  formal: 75,
  luxury: 60,
  openSpaces: 40,
  naturalLight: 80,
  colorPreference: "Neutral",
  lifestyle: ["wfh", "garden", "minimal", "tech"],
};

function deriveProfile(data: PersonalityData) {
  if (data.introvert < 40 && data.luxury > 60) return "The Refined Extrovert";
  if (data.introvert > 60 && data.naturalLight > 70) return "The Quiet Minimalist";
  if (data.formal < 40 && data.lifestyle.includes("tech")) return "The Creative Disruptor";
  if (data.openSpaces > 60 && data.lifestyle.includes("entertain")) return "The Social Connector";
  return "The Thoughtful Professional";
}

export default function ProjectPersonality() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();
  const { data, setData, save, isSaving, saved } = useProjectMission<PersonalityData>(projectId, "personality", DEFAULT);

  const slider = (key: keyof PersonalityData) => ({
    value: [data[key] as number],
    onValueChange: ([v]: number[]) => setData((d) => ({ ...d, [key]: v })),
    max: 100,
    step: 1,
  });

  const toggleLifestyle = (id: string) =>
    setData((d) => ({
      ...d,
      lifestyle: d.lifestyle.includes(id) ? d.lifestyle.filter((x) => x !== id) : [...d.lifestyle, id],
    }));

  const handleSave = async () => {
    await save();
    toast({ title: "Profile Saved", description: "Personality profile updated." });
  };

  const profile = deriveProfile(data);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personality Analysis</h1>
          <p className="text-sm text-muted-foreground font-mono">Psychological and behavioral mapping.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <BrainCircuit className="w-4 h-4 mr-2" />
          )}
          {saved ? "Saved" : "Save Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader><CardTitle>Psychometric Profiling</CardTitle></CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Introvert</span>
                <span className="font-mono text-primary">{data.introvert}</span>
                <span>Extrovert</span>
              </div>
              <Slider {...slider("introvert")} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Formal</span>
                <span className="font-mono text-primary">{data.formal}</span>
                <span>Relaxed</span>
              </div>
              <Slider {...slider("formal")} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Luxury</span>
                <span className="font-mono text-primary">{data.luxury}</span>
                <span>Practical</span>
              </div>
              <Slider {...slider("luxury")} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Open Spaces</span>
                <span className="font-mono text-primary">{data.openSpaces}</span>
                <span>Private Enclaves</span>
              </div>
              <Slider {...slider("openSpaces")} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Natural Light Need</span>
                <span className="font-mono text-primary">{data.naturalLight}</span>
              </div>
              <Slider {...slider("naturalLight")} />
            </div>
            <div className="space-y-3">
              <Label>Color Preference</Label>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {COLOR_OPTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setData((d) => ({ ...d, colorPreference: c }))}
                    className={`h-8 rounded flex items-center justify-center text-xs font-mono border-2 transition-all ${
                      data.colorPreference === c
                        ? "border-primary scale-105"
                        : "border-transparent opacity-50"
                    } ${
                      c === "Neutral" ? "bg-stone-200 dark:bg-stone-800" :
                      c === "Warm" ? "bg-amber-100 dark:bg-amber-900" :
                      c === "Cool" ? "bg-slate-200 dark:bg-slate-800" :
                      "bg-red-500 text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Lifestyle Indicators</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {LIFESTYLE_OPTS.map(({ id, label }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    checked={data.lifestyle.includes(id)}
                    onCheckedChange={() => toggleLifestyle(id)}
                  />
                  <Label htmlFor={id} className="font-normal cursor-pointer">{label}</Label>
                </div>
              ))}
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
              <h3 className="text-xl font-bold mb-4">"{profile}"</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Introversion</span>
                    <span>{data.introvert}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${data.introvert}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Practicality</span>
                    <span>{100 - data.luxury}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${100 - data.luxury}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>Nature Affinity</span>
                    <span>{data.naturalLight}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${data.naturalLight}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-sm mt-6 text-muted-foreground leading-relaxed">
                {data.introvert > 60
                  ? "Design should prioritize retreat and contemplation. Emphasize acoustic separation, curated views to nature, and practical finishes."
                  : "Design should facilitate social interaction and visibility. Emphasize flowing open spaces and dynamic public areas."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
