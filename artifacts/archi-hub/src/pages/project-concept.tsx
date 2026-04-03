import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Layers, SplitSquareHorizontal, CheckCircle2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Concept {
  title: string;
  narrative: string;
  tags: string[];
  palette: string[];
  materials?: string[];
  formalStrategy?: string;
  precedents?: string[];
}

const FALLBACK_CONCEPTS: Concept[] = [
  {
    title: "The Anchored Frame",
    narrative: "A heavy concrete plinth grounds the structure, contrasting with a delicate, transparent upper volume. It expresses permanence below and ephemeral lightness above.",
    tags: ["Brutalist Base", "Glass Pavilion", "Structural Expression", "Dualism"],
    palette: ["#545454", "#8c8c8c", "#e5e7eb", "#8b5cf6", "#1e293b"],
    materials: ["Board-formed concrete", "Structural glass", "Weathering steel"],
    formalStrategy: "A podium base supports a floating transparent pavilion, with a clear datum line separating the two conditions.",
    precedents: ["Louis Kahn – Salk Institute", "Herzog & de Meuron – Tate Modern"],
  },
  {
    title: "Filtered Light",
    narrative: "A porous facade acts as an environmental filter, modulating harsh sunlight while creating dramatic interior shadow play. Mass is carved to follow solar angles.",
    tags: ["Parametric Louvers", "Solar Carving", "Chiaroscuro", "Monolithic"],
    palette: ["#b45309", "#d97706", "#fef3c7", "#171717", "#404040"],
    materials: ["Terracotta brise-soleil", "Raw concrete", "Oxidized copper"],
    formalStrategy: "A monolithic mass is subtracted through a solar carving logic, with openings calibrated to seasonal sun angles.",
    precedents: ["Jean Nouvel – Arab World Institute", "Bjarke Ingels – Blaavand Bunker Museum"],
  },
  {
    title: "Borrowed Landscape",
    narrative: "The building dissolves its boundaries, pulling the exterior landscape into deep interior courtyards. Roof planes extend to blur the threshold of enclosure.",
    tags: ["Biophilic", "Deep Overhangs", "Courtyard Typology", "Horizontal"],
    palette: ["#27272a", "#166534", "#4ade80", "#d4d4d8", "#78716c"],
    materials: ["Charred timber", "Rammed earth", "Living wall panels"],
    formalStrategy: "Linear bars are arranged to create a series of interlocking courtyards, each oriented to frame a specific landscape view.",
    precedents: ["Alvaro Siza – Galician Centre", "Peter Zumthor – Therme Vals"],
  },
];

export default function ProjectConcept() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const [concepts, setConcepts]           = useState<Concept[]>(FALLBACK_CONCEPTS);
  const [selectedIdx, setSelectedIdx]     = useState(0);
  const [generating, setGenerating]       = useState(false);
  const [mode, setMode]                   = useState<"cards" | "moodboard" | "compare">("cards");
  const [metaLoaded, setMetaLoaded]       = useState(false);

  // Load saved concepts from metadata
  const loadMeta = useCallback(() => {
    if (!projectId) return;
    fetch(`${BASE}/api/projects/${projectId}/metadata`)
      .then(r => r.json())
      .then((meta: Record<string, unknown>) => {
        if (Array.isArray(meta.concepts) && meta.concepts.length > 0) {
          setConcepts(meta.concepts as Concept[]);
        }
      })
      .finally(() => setMetaLoaded(true));
  }, [projectId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleGenerateNew = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/projects/${projectId}/concepts`, { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json() as { concepts: Concept[] };
      if (data.concepts?.length) {
        setConcepts(data.concepts);
        setSelectedIdx(0);
        setMode("cards");
        toast({ title: "New Concepts Generated", description: `${data.concepts.length} AI design directions created from your brief.` });
      }
    } catch {
      toast({ title: "Generation Failed", description: "Could not generate concepts. Try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectConcept = (idx: number) => {
    setSelectedIdx(idx);
    // Persist for cross-page use (massing generator reads this)
    localStorage.setItem(`project-${projectId}-selectedConceptIdx`, String(idx));
    toast({ title: `Concept ${String.fromCharCode(65 + idx)} Selected`, description: `"${concepts[idx].title}" is now the active design concept.` });
  };

  const toggleMode = (target: "moodboard" | "compare") => {
    setMode(prev => prev === target ? "cards" : target);
  };

  const selected = concepts[selectedIdx] ?? concepts[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concept Studio</h1>
          <p className="text-sm text-muted-foreground font-mono">Narrative generation and stylistic direction.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toggleMode("compare")}
            className={mode === "compare" ? "border-primary/60 text-primary" : ""}
          >
            <SplitSquareHorizontal className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button
            variant="outline"
            onClick={() => toggleMode("moodboard")}
            className={mode === "moodboard" ? "border-primary/60 text-primary" : ""}
          >
            <Layers className="w-4 h-4 mr-2" />
            Moodboard
          </Button>
          <Button onClick={handleGenerateNew} disabled={generating}>
            {generating
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Lightbulb className="w-4 h-4 mr-2" />}
            {generating ? "Generating…" : "Generate New"}
          </Button>
        </div>
      </div>

      {/* Active concept badge strip */}
      {metaLoaded && (
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span>Active:</span>
          <Badge variant="secondary" className="font-mono">{selected.title}</Badge>
          {mode !== "cards" && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setMode("cards")}>
              <X className="w-3 h-3 mr-1" /> Back to cards
            </Button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ─── COMPARE MODE ─── */}
        {mode === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardHeader><CardTitle>Side-by-Side Comparison</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-xs font-mono text-muted-foreground w-32">Attribute</th>
                      {concepts.map((c, i) => (
                        <th key={i} className={`text-left py-2 px-3 ${selectedIdx === i ? "text-primary" : ""}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                            {c.title}
                            {selectedIdx === i && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr>
                      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Narrative</td>
                      {concepts.map((c, i) => (
                        <td key={i} className="py-3 px-3 text-muted-foreground leading-relaxed text-xs">{c.narrative}</td>
                      ))}
                    </tr>
                    {concepts.some(c => c.formalStrategy) && (
                      <tr>
                        <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Strategy</td>
                        {concepts.map((c, i) => (
                          <td key={i} className="py-3 px-3 text-muted-foreground text-xs">{c.formalStrategy ?? "—"}</td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Tags</td>
                      {concepts.map((c, i) => (
                        <td key={i} className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {c.tags.map((t, ti) => (
                              <Badge key={ti} variant="secondary" className="text-[9px] font-mono bg-muted/50 border-0">{t}</Badge>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {concepts.some(c => c.materials?.length) && (
                      <tr>
                        <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Materials</td>
                        {concepts.map((c, i) => (
                          <td key={i} className="py-3 px-3 text-muted-foreground text-xs">
                            {(c.materials ?? []).join(", ") || "—"}
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Palette</td>
                      {concepts.map((c, i) => (
                        <td key={i} className="py-3 px-3">
                          <div className="flex h-5 rounded overflow-hidden w-28">
                            {c.palette.map((col, ci) => (
                              <div key={ci} className="flex-1" style={{ backgroundColor: col }} />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {concepts.some(c => c.precedents?.length) && (
                      <tr>
                        <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Precedents</td>
                        {concepts.map((c, i) => (
                          <td key={i} className="py-3 px-3 text-muted-foreground text-xs">
                            {(c.precedents ?? []).join(" / ") || "—"}
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">Select</td>
                      {concepts.map((c, i) => (
                        <td key={i} className="py-3 px-3">
                          <Button
                            size="sm"
                            variant={selectedIdx === i ? "default" : "outline"}
                            onClick={() => handleSelectConcept(i)}
                          >
                            {selectedIdx === i ? "✓ Active" : "Use This"}
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── MOODBOARD MODE ─── */}
        {mode === "moodboard" && (
          <motion.div key="moodboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Moodboard — {selected.title}</CardTitle>
                  <div className="flex gap-2">
                    {concepts.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedIdx(i)}
                        className={`text-xs font-mono px-2 py-1 rounded transition-all ${selectedIdx === i ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"}`}
                      >
                        0{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Hero palette */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Colour Palette</p>
                  <div className="grid grid-cols-5 gap-2 h-24">
                    {selected.palette.map((col, i) => (
                      <div key={i} className="rounded-lg flex flex-col items-center justify-end pb-2" style={{ backgroundColor: col }}>
                        <span className="text-[9px] font-mono text-white/70 drop-shadow">{col.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Narrative */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Design Narrative</p>
                    <p className="text-sm leading-relaxed text-foreground/90">{selected.narrative}</p>
                  </div>
                  {selected.formalStrategy && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Formal Strategy</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{selected.formalStrategy}</p>
                    </div>
                  )}
                </div>

                {/* Keywords grid */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Stylistic Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map((tag, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 rounded border text-sm font-mono tracking-wide"
                        style={{ borderColor: selected.palette[i % selected.palette.length] + "88", color: selected.palette[i % selected.palette.length] }}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                {selected.materials && selected.materials.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Material Palette</p>
                    <div className="grid grid-cols-3 gap-3">
                      {selected.materials.map((mat, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-4 border border-border/50 flex items-center justify-center text-center"
                          style={{ backgroundColor: selected.palette[i % selected.palette.length] + "22" }}
                        >
                          <div>
                            <div className="w-6 h-6 rounded mx-auto mb-2" style={{ backgroundColor: selected.palette[i % selected.palette.length] }} />
                            <p className="text-xs font-mono text-foreground/80">{mat}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Precedents */}
                {selected.precedents && selected.precedents.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Architectural Precedents</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.precedents.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono text-muted-foreground">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── CARDS MODE ─── */}
        {mode === "cards" && (
          <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Mood profile bar */}
            <Card className="bg-card/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Computed Mood Profile</h3>
                  <Badge variant="secondary" className="font-mono text-[10px]">Active: {selected.title}</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Natural", right: "Industrial", leftPct: selected.tags.some(t => /biophilic|landscape|green|organic/i.test(t)) ? 65 : 30 },
                    { label: "Minimal", right: "Expressive", leftPct: selected.tags.some(t => /minimal|clean|simple|monolith/i.test(t)) ? 75 : 40 },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span>{row.label}</span>
                        <span>{row.right}</span>
                      </div>
                      <div className="h-2 flex bg-muted rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-500" style={{ width: `${row.leftPct}%`, backgroundColor: selected.palette[2] }} />
                        <div className="h-full flex-1" style={{ backgroundColor: selected.palette[0] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Concept cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {concepts.map((concept, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <motion.div key={idx} animate={{ scale: isSelected ? 1 : 0.98 }} transition={{ duration: 0.15 }}>
                    <Card
                      className={`flex flex-col transition-all cursor-pointer h-full ${
                        isSelected ? "border-primary shadow-lg shadow-primary/10 bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => handleSelectConcept(idx)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-muted-foreground">Option 0{idx + 1}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <CardTitle className="text-xl">{concept.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{concept.narrative}</p>

                        {concept.formalStrategy && (
                          <p className="text-xs text-muted-foreground/70 italic border-l-2 border-primary/30 pl-3">{concept.formalStrategy}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {concept.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-mono uppercase bg-muted/50 text-muted-foreground border-0">{tag}</Badge>
                          ))}
                        </div>

                        <div>
                          <h4 className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5">Palette</h4>
                          <div className="flex h-5 rounded overflow-hidden">
                            {concept.palette.map((color, i) => (
                              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                        </div>

                        {concept.precedents && concept.precedents.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Precedents</h4>
                            <p className="text-[10px] text-muted-foreground/60 font-mono">{concept.precedents.join(" · ")}</p>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          variant={isSelected ? "default" : "outline"}
                          onClick={e => { e.stopPropagation(); handleSelectConcept(idx); }}
                        >
                          {isSelected ? "✓ Selected Concept" : "Select Concept"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
