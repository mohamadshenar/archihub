import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sofa, Palette, Download, Loader2, CheckCircle2, Lightbulb, Layers, Sparkles, History, Wand2, X, RotateCcw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

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

function SpacePanel({
  spec, imageUrl, visualizing,
}: {
  spec: SpaceSpec;
  imageUrl?: string;
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

  const aiImg = imageUrl ?? spec.imageUrl;

  return (
    <div className="space-y-5">
      {spec.keyFeature && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Key Feature — Lobby</p>
          <p className="text-sm text-foreground leading-relaxed">{spec.keyFeature}</p>
        </div>
      )}

      {/* AI Visualisation area */}
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
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80" />
            <Loader2 className="w-8 h-8 text-primary animate-spin z-10" />
            <p className="text-xs text-muted-foreground/80 font-mono z-10">Generating AI visualisation…</p>
          </motion.div>
        ) : aiImg ? (
          <motion.div
            key="ai"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-xl overflow-hidden border border-border/40"
          >
            <img
              src={aiImg}
              alt="Lobby interior visualisation"
              className="w-full object-cover"
              style={{ maxHeight: 420 }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-3">
              <p className="text-white text-xs font-mono uppercase tracking-widest opacity-90">AI Visualisation · Lobby</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-border/50 bg-muted/10 flex flex-col items-center justify-center gap-2 py-16 text-center"
          >
            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60 font-mono">Click Generate Interior to visualise this lobby</p>
          </motion.div>
        )}
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
  const [imageHistory,   setImageHistory]   = useState<{ imageUrl: string; style: string; generatedAt: string; editPrompt?: string }[]>([]);
  const [metaLoaded,     setMetaLoaded]     = useState(false);
  const [editPrompt,     setEditPrompt]     = useState("");
  const [editing,        setEditing]        = useState(false);
  const [historyOpen,    setHistoryOpen]    = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const loadMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/metadata`, { cache: "no-store" });
      if (!res.ok) return;
      const meta = await res.json() as {
        interior?:             InteriorDesign;
        concepts?:             { palette?: string[] }[];
        selectedConceptIdx?:   number;
        interiorImageHistory?: { imageUrl: string; style: string; generatedAt: string }[];
      };
      if (meta.interior) {
        setInterior(meta.interior);
        if (meta.interior.selectedStyle) setSelectedStyle(meta.interior.selectedStyle);
        const imgs: Record<string, string> = {};
        for (const [sp, spec] of Object.entries(meta.interior.spaces ?? {})) {
          if (spec?.imageUrl) imgs[sp] = spec.imageUrl;
        }
        if (Object.keys(imgs).length > 0) setSpaceImages(imgs);
      }
      if (meta.interiorImageHistory?.length) {
        setImageHistory(meta.interiorImageHistory);
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
      const data = await res.json() as {
        images: Record<string, string>;
        interiorImageHistory?: { imageUrl: string; style: string; generatedAt: string }[];
      };
      setSpaceImages(data.images);
      if (data.interiorImageHistory) setImageHistory(data.interiorImageHistory);
      toast({ title: "Visual Generated", description: `Lobby visualisation ready — added to history.` });
    } catch {
      toast({ title: "Visualisation Failed", description: "Could not generate space images.", variant: "destructive" });
    } finally {
      setVisualizing(false);
    }
  }, [projectId, toast]);

  const handleEditGenerate = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setEditing(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/interior/visualize/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editPrompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as {
        imageUrl: string;
        interiorImageHistory?: { imageUrl: string; style: string; generatedAt: string; editPrompt?: string }[];
      };
      setSpaceImages({ lobby: data.imageUrl });
      if (data.interiorImageHistory) setImageHistory(data.interiorImageHistory);
      setEditPrompt("");
      toast({ title: "Edit Applied", description: "New visualisation generated with your edit." });
    } catch {
      toast({ title: "Edit Failed", variant: "destructive" });
    } finally {
      setEditing(false);
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
        <div className="flex gap-2 flex-wrap items-center">
          {/* History drawer trigger */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative" disabled={imageHistory.length === 0}>
                <History className="w-4 h-4 mr-2" />
                History
                {imageHistory.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {imageHistory.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="font-mono text-sm uppercase tracking-widest">Generation History</SheetTitle>
                <p className="text-xs text-muted-foreground">{imageHistory.length} visualisation{imageHistory.length !== 1 ? "s" : ""} · click any to restore as current</p>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3">
                {[...imageHistory].reverse().map((entry, i) => (
                  <div key={i} className="group rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-colors bg-muted/10">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={entry.imageUrl} alt={entry.style} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-primary/90 rounded px-1.5 py-0.5">
                          <span className="text-[9px] font-mono font-bold text-black">Latest</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => { setSpaceImages({ lobby: entry.imageUrl }); setHistoryOpen(false); }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />Restore
                        </Button>
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="text-[10px] font-mono font-medium text-foreground truncate">{entry.style}</p>
                      <p className="text-[9px] text-muted-foreground/60">{new Date(entry.generatedAt).toLocaleString()}</p>
                      {entry.editPrompt && (
                        <p className="text-[9px] text-primary/70 italic leading-snug">"{entry.editPrompt}"</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-6 text-[10px] mt-1"
                        onClick={() => {
                          setSpaceImages({ lobby: entry.imageUrl });
                          setEditPrompt(entry.editPrompt ? `Based on previous: ${entry.editPrompt}. ` : "");
                          setHistoryOpen(false);
                          setTimeout(() => editInputRef.current?.focus(), 100);
                        }}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />Edit this one
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

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

      {/* Lobby section */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
          <Sofa className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono uppercase tracking-widest text-primary">Lobby</span>
        </div>
        {interior?.spaces?.lobby ? (
          <div className="space-y-4">
            <SpacePanel
              spec={interior.spaces.lobby}
              imageUrl={spaceImages["lobby"]}
              visualizing={visualizing}
            />

            {/* ─── Edit Prompt ─────────────────────────────────────────── */}
            {(spaceImages["lobby"] || interior.spaces.lobby.imageUrl) && !visualizing && (
              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-primary">Edit Visualisation</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Describe a specific change to apply — lighting mood, material, colour temperature, viewpoint, time of day, etc.
                </p>
                <div className="flex gap-2 items-start">
                  <textarea
                    ref={editInputRef}
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    placeholder='e.g. "warmer amber lighting at dusk", "add tall potted olive trees", "marble floor instead of terrazzo", "switch to rainy evening atmosphere"'
                    rows={2}
                    disabled={editing}
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleEditGenerate(editPrompt);
                      }
                    }}
                    className="flex-1 resize-none rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      onClick={() => handleEditGenerate(editPrompt)}
                      disabled={editing || !editPrompt.trim()}
                      size="sm"
                      className="h-9 px-3"
                    >
                      {editing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </Button>
                    {editPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => setEditPrompt("")}
                        disabled={editing}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {editing && (
                  <p className="text-[10px] font-mono text-muted-foreground/60 animate-pulse">
                    Generating edited visualisation… this takes ~20 seconds
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/40 font-mono">⌘ Enter to submit</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Sofa className="w-8 h-8 text-muted-foreground/40 mb-1" />
            <p className="text-sm text-muted-foreground">No interior spec generated yet.</p>
            <p className="text-xs text-muted-foreground/60">Select a style above, then click Generate Interior.</p>
          </div>
        )}
      </div>

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
