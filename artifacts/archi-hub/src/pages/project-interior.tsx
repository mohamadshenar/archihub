import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sofa, Palette, Download, Loader2, CheckCircle2, Lightbulb, Layers, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import imgMinimalistIndustrial from "@assets/stock_images/style-minimalist-industrial.jpg";
import imgWarmBrutalism        from "@assets/stock_images/style-warm-brutalism.jpg";
import imgHighContrast         from "@assets/stock_images/style-high-contrast.jpg";
import imgNordicOrganic        from "@assets/stock_images/style-nordic-organic.jpg";
import imgDarkParametric       from "@assets/stock_images/style-dark-parametric.jpg";
import imgTropicalContemporary from "@assets/stock_images/style-tropical-contemporary.jpg";

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
  imageUrl?:        string;
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
  { name: "Minimalist Industrial", desc: "Exposed services, polished concrete, sharp steel details.", colors: ["#1c1917","#44403c","#a8a29e","#e7e5e4","#ea580c"], img: imgMinimalistIndustrial },
  { name: "Warm Brutalism",        desc: "Heavy board-formed concrete softened by rich timber elements.", colors: ["#292524","#57534e","#78716c","#b45309","#fcd34d"], img: imgWarmBrutalism },
  { name: "High Contrast",         desc: "Dramatic dark walls punctuated by stark white furniture.", colors: ["#0a0a0a","#171717","#404040","#d4d4d8","#fafafa"], img: imgHighContrast },
  { name: "Nordic Organic",        desc: "Pale timber, linen tones, and biophilic material warmth.", colors: ["#fafaf9","#e7e5e4","#c4b49a","#78716c","#166534"], img: imgNordicOrganic },
  { name: "Dark Parametric",       desc: "Faceted surfaces, gradient metallic finishes, dramatic geometry.", colors: ["#09090b","#18181b","#3f3f46","#6366f1","#a78bfa"], img: imgDarkParametric },
  { name: "Tropical Contemporary", desc: "Natural rattan, green foliage walls, terracotta and lush greenery.", colors: ["#fef3c7","#d4d4a0","#4ade80","#166534","#92400e"], img: imgTropicalContemporary },
];

const STYLE_IMG: Record<string, string> = Object.fromEntries(
  STYLE_OPTIONS.map(s => [s.name, s.img])
);

const SPACE_LABELS: Record<string, string> = {
  lobby: "Lobby", workspace: "Workspace", exhibition: "Exhibition", cafe: "Cafe",
};

function SpacePanel({
  spec, imageUrl, styleImg, space, visualizing,
}: {
  spec: SpaceSpec;
  imageUrl?: string;
  styleImg?: string;
  space: string;
  visualizing?: boolean;
}) {
  const rows = [
    { label: "Lighting Mood",      value: spec.lightingMood },
    { label: "Colour Temperature", value: spec.lightingTemp },
    { label: "Primary Finish",     value: spec.primaryFinish },
    { label: "Secondary Finish",   value: spec.secondaryFinish },
    { label: "Flooring",           value: spec.flooringMaterial },
    { label: "Ceiling",            value: spec.ceilingTreatment },
    { label: "Seating / FF&E",     value: spec.seating },
    { label: "Acoustics",          value: spec.acoustics },
  ];

  // Priority: AI-generated per-space image → saved spec imageUrl → style reference photo
  const aiImg   = imageUrl ?? spec.imageUrl;
  const refImg  = styleImg;
  const caption = aiImg ? `AI Visualisation · ${SPACE_LABELS[space]}` : `Style Reference · ${SPACE_LABELS[space]}`;

  return (
    <div className="space-y-5">
      {spec.keyFeature && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Key Feature — {SPACE_LABELS[space]}</p>
          <p className="text-sm text-foreground leading-relaxed">{spec.keyFeature}</p>
        </div>
      )}

      {/* Visual area — always shows something */}
      <AnimatePresence mode="wait">
        {visualizing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-3"
            style={{ height: 300 }}
          >
            {refImg && (
              <img src={refImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80" />
            <Loader2 className="w-8 h-8 text-primary animate-spin z-10" />
            <p className="text-xs text-muted-foreground/80 font-mono z-10">Generating AI visualisation…</p>
          </motion.div>
        ) : (aiImg || refImg) ? (
          <motion.div
            key={aiImg ? "ai" : "ref"}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-xl overflow-hidden border border-border/40"
          >
            <img
              src={aiImg ?? refImg}
              alt={`${SPACE_LABELS[space]} interior`}
              className="w-full object-cover"
              style={{ maxHeight: 360 }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-3 flex items-end justify-between">
              <p className="text-white text-xs font-mono uppercase tracking-widest opacity-90">{caption}</p>
              {!aiImg && (
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wide">Style reference</span>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

  const [interior,       setInterior]       = useState<InteriorDesign | null>(null);
  const [selectedStyle,  setSelectedStyle]  = useState<string>("Minimalist Industrial");
  const [conceptPalette, setConceptPalette] = useState<string[]>([]);
  const [generating,     setGenerating]     = useState(false);
  const [visualizing,    setVisualizing]    = useState(false);
  const [spaceImages,    setSpaceImages]    = useState<Record<string, string>>({});
  const [metaLoaded,     setMetaLoaded]     = useState(false);

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
        // Restore any persisted space images
        const imgs: Record<string, string> = {};
        for (const [sp, spec] of Object.entries(meta.interior.spaces ?? {})) {
          if (spec?.imageUrl) imgs[sp] = spec.imageUrl;
        }
        if (Object.keys(imgs).length > 0) setSpaceImages(imgs);
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

  const handleSelectStyle = async (name: string) => {
    setSelectedStyle(name);
    await fetch(`${BASE}/api/projects/${projectId}/metadata`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "interior", data: { ...(interior ?? {}), selectedStyle: name } }),
    }).catch(() => {});
    toast({ title: "Style Direction Selected", description: `"${name}" is now the active interior direction.` });
  };

  const triggerVisualize = useCallback(async (style: string) => {
    setVisualizing(true);
    setSpaceImages({});
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/interior/visualize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedStyle: style }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { images: Record<string, string> };
      setSpaceImages(data.images);
      toast({ title: "Visuals Ready", description: "Interior visualisations generated for all spaces." });
    } catch {
      toast({ title: "Visualisation Failed", description: "Could not generate space images.", variant: "destructive" });
    } finally {
      setVisualizing(false);
    }
  }, [projectId, toast]);

  const handleGenerate = async () => {
    setGenerating(true);
    setSpaceImages({});
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
      toast({ title: "Interior Design Generated", description: `"${selectedStyle}" specification ready. Generating visuals…` });
      // Kick off image generation immediately after spec is ready
      triggerVisualize(selectedStyle);
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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `interior-spec-project-${projectId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const palette = conceptPalette.length > 0 ? conceptPalette : interior?.colorPalette ?? [];
  const hasSpec  = !!interior;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interior Design</h1>
          <p className="text-sm text-muted-foreground font-mono">Spatial aesthetics and FF&amp;E coordination.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasSpec && !visualizing && Object.keys(spaceImages).length === 0 && (
            <Button variant="outline" onClick={() => triggerVisualize(selectedStyle)} disabled={visualizing}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Visuals
            </Button>
          )}
          {visualizing && (
            <Button variant="outline" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating visuals…
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} disabled={!interior}>
            <Download className="w-4 h-4 mr-2" />
            Export Spec
          </Button>
          <Button onClick={handleGenerate} disabled={generating || visualizing}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sofa className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate Interior"}
          </Button>
        </div>
      </div>

      {/* Style picker + palette reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {/* Photo thumbnail */}
                    <div className="relative h-20 overflow-hidden">
                      <img
                        src={s.img}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      {/* colour strip overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 flex">
                        {s.colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
                      </div>
                      {active && (
                        <div className="absolute top-1.5 right-1.5">
                          <CheckCircle2 className="w-4 h-4 text-primary drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold leading-tight mb-0.5">{s.name}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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

      {/* Style description + material palette */}
      {interior && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {interior.styleDescription && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1.5">Style Direction</p>
              <p className="text-sm text-foreground leading-relaxed">{interior.styleDescription}</p>
            </div>
          )}

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
          const spec     = interior?.spaces?.[space as keyof typeof interior.spaces];
          const styleImg = STYLE_IMG[selectedStyle];
          return (
            <TabsContent key={space} value={space} className="pt-6">
              {spec ? (
                <SpacePanel
                  spec={spec}
                  imageUrl={spaceImages[space]}
                  styleImg={styleImg}
                  space={space}
                  visualizing={visualizing}
                />
              ) : (
                /* No spec yet — show the style reference photo with an overlay prompt */
                <div className="relative rounded-xl overflow-hidden border border-border/40">
                  {styleImg ? (
                    <>
                      <img
                        src={styleImg}
                        alt={selectedStyle}
                        className="w-full object-cover opacity-40"
                        style={{ maxHeight: 320 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 flex flex-col items-center justify-end pb-10 text-center gap-2 px-6">
                        <p className="text-sm font-semibold text-white">{selectedStyle} — Style Preview</p>
                        <p className="text-xs text-white/60">Click Generate Interior to create your full specification with AI-generated visuals for each space.</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Sofa className="w-8 h-8 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">No interior spec generated yet.</p>
                      <p className="text-xs text-muted-foreground/60">Select a style above, then click Generate Interior.</p>
                    </div>
                  )}
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
              <CardHeader className="pb-2"><CardTitle className="text-sm">FF&amp;E Strategy</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{interior.ffStrategy}</p>
              </CardContent>
            </Card>
          )}
          {interior.sustainabilityNotes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sustainability Notes</CardTitle></CardHeader>
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
