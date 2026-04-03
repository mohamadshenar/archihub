import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sofa, Palette, Download, Loader2, CheckCircle2, Lightbulb, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SpaceSpec {
  lightingMood:     string;
  lightingTemp:     string;
  primaryFinish:    string;
  secondaryFinish:  string;
  flooringMaterial: string;
  ceilingTreatment: string;
  seating:          string;
  acoustics:        string;
  keyFeature:       string;
}

interface MaterialEntry { name: string; role: string; description: string; }

interface InteriorDesign {
  selectedStyle:     string;
  styleDescription:  string;
  colorPalette:      string[];
  spaces: {
    lobby?:      SpaceSpec;
    workspace?:  SpaceSpec;
    exhibition?: SpaceSpec;
    cafe?:       SpaceSpec;
  };
  materialPalette:   MaterialEntry[];
  ffStrategy:        string;
  sustainabilityNotes: string;
  generatedAt?:      string;
}

const STYLE_OPTIONS = [
  {
    name: "Minimalist Industrial",
    desc: "Exposed services, polished concrete, sharp steel details.",
    colors: ["#1c1917", "#44403c", "#a8a29e", "#e7e5e4", "#ea580c"],
  },
  {
    name: "Warm Brutalism",
    desc: "Heavy board-formed concrete softened by rich timber elements.",
    colors: ["#292524", "#57534e", "#78716c", "#b45309", "#fcd34d"],
  },
  {
    name: "High Contrast",
    desc: "Dramatic dark walls punctuated by stark white furniture.",
    colors: ["#0a0a0a", "#171717", "#404040", "#d4d4d8", "#fafafa"],
  },
  {
    name: "Nordic Organic",
    desc: "Pale timber, linen tones, and biophilic material warmth.",
    colors: ["#fafaf9", "#e7e5e4", "#c4b49a", "#78716c", "#166534"],
  },
  {
    name: "Dark Parametric",
    desc: "Faceted surfaces, gradient metallic finishes, dramatic geometry.",
    colors: ["#09090b", "#18181b", "#3f3f46", "#6366f1", "#a78bfa"],
  },
  {
    name: "Tropical Contemporary",
    desc: "Natural rattan, green foliage walls, terracotta and lush greenery.",
    colors: ["#fef3c7", "#d4d4a0", "#4ade80", "#166534", "#92400e"],
  },
];

const SPACE_LABELS: Record<string, string> = {
  lobby: "Lobby",
  workspace: "Workspace",
  exhibition: "Exhibition",
  cafe: "Cafe",
};

function SpacePanel({ spec }: { spec: SpaceSpec }) {
  const rows = [
    { label: "Lighting Mood",     value: spec.lightingMood },
    { label: "Colour Temperature", value: spec.lightingTemp },
    { label: "Primary Finish",    value: spec.primaryFinish },
    { label: "Secondary Finish",  value: spec.secondaryFinish },
    { label: "Flooring",          value: spec.flooringMaterial },
    { label: "Ceiling",           value: spec.ceilingTreatment },
    { label: "Seating / FF&E",    value: spec.seating },
    { label: "Acoustics",         value: spec.acoustics },
  ];
  return (
    <div className="space-y-4">
      {spec.keyFeature && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Key Feature</p>
          <p className="text-sm text-foreground leading-relaxed">{spec.keyFeature}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map(r => (
          <div key={r.label} className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{r.label}</p>
            <p className="text-sm text-foreground leading-relaxed">{r.value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectInterior() {
  const params    = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [interior,    setInterior]   = useState<InteriorDesign | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("Minimalist Industrial");
  const [conceptPalette, setConceptPalette] = useState<string[]>([]);
  const [generating,  setGenerating] = useState(false);
  const [metaLoaded,  setMetaLoaded] = useState(false);

  // Load saved interior data + concept palette
  const loadMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" });
      if (!res.ok) return;
      const meta = await res.json() as {
        interior?:          InteriorDesign;
        concepts?:          { palette?: string[] }[];
        selectedConceptIdx?: number;
      };
      if (meta.interior) {
        setInterior(meta.interior);
        if (meta.interior.selectedStyle) setSelectedStyle(meta.interior.selectedStyle);
      }
      if (meta.concepts?.length) {
        const storedLocal = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
        const idx = meta.selectedConceptIdx ?? (storedLocal !== null ? parseInt(storedLocal) || 0 : 0);
        const palette = meta.concepts[idx]?.palette ?? meta.concepts[0]?.palette ?? [];
        setConceptPalette(palette);
      }
    } finally {
      setMetaLoaded(true);
    }
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  // Save style selection immediately on click
  const handleSelectStyle = async (name: string) => {
    setSelectedStyle(name);
    // Optimistically update saved interior section
    await fetch(`${BASE}/api/projects/${projectId}/metadata`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "interior",
        data: { ...(interior ?? {}), selectedStyle: name },
      }),
    }).catch(() => {});
    toast({ title: "Style Direction Selected", description: `"${name}" is now the active interior direction.` });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const storedLocal = localStorage.getItem(`project-${projectId}-selectedConceptIdx`);
      const selectedConceptIdx = storedLocal !== null ? parseInt(storedLocal) || 0 : 0;

      const res = await fetch(`${BASE}/api/projects/${projectId}/interior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedStyle, selectedConceptIdx }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { interior: InteriorDesign };
      setInterior(data.interior);
      if (data.interior.colorPalette?.length) setConceptPalette(data.interior.colorPalette);
      toast({ title: "Interior Design Generated", description: `"${selectedStyle}" specification ready.` });
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate interior spec. Try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!interior) {
      toast({ title: "No Data", description: "Generate an interior spec first.", variant: "destructive" });
      return;
    }
    const lines = [
      `INTERIOR DESIGN SPECIFICATION — PROJECT ${projectId}`,
      `Generated: ${interior.generatedAt ? new Date(interior.generatedAt).toLocaleString() : "—"}`,
      `Style Direction: ${interior.selectedStyle}`,
      ``,
      `STYLE OVERVIEW`,
      interior.styleDescription,
      ``,
      `COLOUR PALETTE`,
      (interior.colorPalette ?? []).join("  ·  "),
      ``,
      `MATERIAL PALETTE`,
      ...(interior.materialPalette ?? []).map(m => `${m.role.toUpperCase()}: ${m.name} — ${m.description}`),
      ``,
      `FF&E STRATEGY`,
      interior.ffStrategy,
      ``,
      `SUSTAINABILITY NOTES`,
      interior.sustainabilityNotes,
      ``,
      ...Object.entries(interior.spaces ?? {}).flatMap(([space, spec]) => [
        `━━━ ${SPACE_LABELS[space] ?? space.toUpperCase()} ━━━`,
        `Key Feature:       ${spec?.keyFeature ?? "—"}`,
        `Lighting Mood:     ${spec?.lightingMood ?? "—"}`,
        `Colour Temp:       ${spec?.lightingTemp ?? "—"}`,
        `Primary Finish:    ${spec?.primaryFinish ?? "—"}`,
        `Secondary Finish:  ${spec?.secondaryFinish ?? "—"}`,
        `Flooring:          ${spec?.flooringMaterial ?? "—"}`,
        `Ceiling:           ${spec?.ceilingTreatment ?? "—"}`,
        `Seating/FF&E:      ${spec?.seating ?? "—"}`,
        `Acoustics:         ${spec?.acoustics ?? "—"}`,
        ``,
      ]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interior-spec-project-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const palette = conceptPalette.length > 0 ? conceptPalette : interior?.colorPalette ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interior Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial aesthetics and FF&amp;E coordination.</p>
          {interior?.styleDirection && (
            <p className="text-xs text-primary font-mono mt-1 leading-relaxed">{interior.styleDescription}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!interior}>
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sofa className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate Interior"}
          </Button>
        </div>
      </div>

      {/* Style direction + palette reference row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Style picker */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Interior Style Direction
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">Select to apply + save</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STYLE_OPTIONS.map(s => {
                const active = selectedStyle === s.name;
                return (
                  <div
                    key={s.name}
                    onClick={() => handleSelectStyle(s.name)}
                    className={`rounded-lg cursor-pointer border transition-all overflow-hidden ${
                      active ? "border-primary shadow-md shadow-primary/10" : "border-border/40 hover:border-primary/50"
                    }`}
                  >
                    <div className="h-8 flex">
                      {s.colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        {active && <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />}
                        <p className="text-[11px] font-semibold leading-tight">{s.name}</p>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-tight">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Concept palette reference */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Concept Colour Reference
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">Interior palette derived from this</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {palette.length > 0 ? (
              <>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${palette.length}, 1fr)` }}>
                  {palette.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-full h-12 rounded-md border border-border/30" style={{ backgroundColor: hex }} />
                      <span className="text-[9px] font-mono text-muted-foreground">{hex.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                {interior?.selectedStyle && (
                  <div className="text-xs font-mono text-muted-foreground border-t border-border/30 pt-3">
                    Active style: <span className="text-foreground">{interior.selectedStyle}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No concept palette found. Go to Concept Studio to select a concept — its colours will guide the interior.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Style description + material palette (if generated) */}
      {interior && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {interior.styleDescription && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1.5">Style Direction</p>
              <p className="text-sm text-foreground leading-relaxed">{interior.styleDescription}</p>
            </div>
          )}

          {/* Material palette */}
          {interior.materialPalette?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Material Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {interior.materialPalette.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: palette[i] ?? "#555" }} />
                        <Badge variant="outline" className="text-[9px] font-mono uppercase">{m.role}</Badge>
                      </div>
                      <p className="text-xs font-semibold mb-0.5">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Space tabs */}
      <Tabs defaultValue="lobby" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-1">
          {["lobby", "workspace", "exhibition", "cafe"].map(space => (
            <TabsTrigger
              key={space}
              value={space}
              className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary"
            >
              {SPACE_LABELS[space]}
            </TabsTrigger>
          ))}
        </TabsList>

        {["lobby", "workspace", "exhibition", "cafe"].map(space => {
          const spec = interior?.spaces?.[space as keyof typeof interior.spaces];
          return (
            <TabsContent key={space} value={space} className="pt-6">
              {spec ? (
                <SpacePanel spec={spec} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sofa className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No interior spec generated yet.</p>
                  <p className="text-xs text-muted-foreground/60">Select a style above, then click Generate Interior.</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* FF&E + Sustainability */}
      {interior && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interior.ffStrategy && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">FF&amp;E Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{interior.ffStrategy}</p>
              </CardContent>
            </Card>
          )}
          {interior.sustainabilityNotes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sustainability Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{interior.sustainabilityNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
