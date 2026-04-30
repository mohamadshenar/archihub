import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";
import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── tiny data interfaces ────────────────────────────────────────────── */
interface Concept { title: string; narrative: string; tags: string[]; materials: string[]; palette: string[] }
interface SiteAnalysis {
  climate?: string; soilType?: string; sunExposure?: string; windDirection?: string;
  topography?: string; surroundingContext?: string; opportunities?: string;
  constraints?: string; zoningInfo?: string; sustainabilityScore?: number;
}
interface ProgramFloor { floor: number; functionName: string; areaPerFloor: number; description?: string }
interface ZoningNode { id: string; zone: string; totalArea: number }
interface Interior {
  selectedStyle?: string; styleDescription?: string;
  materialPalette?: { name: string; role: string; description: string }[];
  spaces?: { lobby?: { keyFeature?: string; lightingMood?: string; primaryFinish?: string; imageUrl?: string } };
  ffStrategy?: string;
}
interface Exterior { styleDirection?: string; primaryMaterial?: { name: string; finish?: string; description?: string } }
interface Brief { styles?: string[]; mustHave?: string; avoid?: string }
interface Regulations { heightLimit?: string; setbacks?: string; farRatio?: string; parkingRequirement?: string; accessibilityNotes?: string; specialConditions?: string }

interface ProjectData {
  id: number; name: string; projectType: string; address?: string;
  siteArea?: number; numFloors?: number; description?: string;
  siteAnalysis?: SiteAnalysis; program?: { floors?: ProgramFloor[] };
  metadata?: {
    concepts?: Concept[]; selectedConceptIdx?: number;
    interior?: Interior; exterior?: Exterior; brief?: Brief;
    zoning?: { nodes?: ZoningNode[] };
    regulations?: Regulations;
  };
}

/* ─── palette bar ─────────────────────────────────────────────────────── */
function PaletteBar({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-5 w-full rounded overflow-hidden border border-white/10">
      {colors.map((c, i) => (
        <div key={i} className="flex-1 relative group" style={{ backgroundColor: c }}>
          <span className="absolute inset-x-0 bottom-0 text-[6px] font-mono text-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 py-0.5 text-white truncate">{c}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── section heading ─────────────────────────────────────────────────── */
function PosterSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3 pb-1 border-b border-white/20">
        <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-amber-400/80">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── stat row ────────────────────────────────────────────────────────── */
function Stat({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-white/10 py-1">
      <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[10px] font-mono text-white/80 text-right">{value}</span>
    </div>
  );
}

/* ─── badge ───────────────────────────────────────────────────────────── */
function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 bg-white/10 border border-white/15 rounded text-[8px] font-mono text-white/70 leading-none">{label}</span>
  );
}

/* ─── dot node ────────────────────────────────────────────────────────── */
function DotNote({ text, lines = 3 }: { text: string; lines?: number }) {
  if (!text) return null;
  const clampStyle: React.CSSProperties = {
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden",
  };
  return (
    <div className="flex gap-1.5 items-start">
      <div className="w-1 h-1 rounded-full bg-amber-400/60 mt-1.5 shrink-0" />
      <p className="text-[9px] text-white/65 leading-relaxed" style={clampStyle}>{text}</p>
    </div>
  );
}

/* ─── short text — first sentence or first N chars ───────────────────── */
function short(text: string | undefined, maxLen = 80): string {
  if (!text) return "";
  const firstSentence = text.split(/\.\s/)[0];
  return firstSentence.length <= maxLen ? firstSentence : firstSentence.slice(0, maxLen) + "…";
}

/* ─── main ────────────────────────────────────────────────────────────── */
export default function ProjectPresentation() {
  const params    = useParams();
  const projectId = parseInt(params.id || "0");

  const [proj,      setProj]      = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    fetch(`${BASE}/api/projects/${projectId}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProj(d as ProjectData); })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  /* derived values */
  const meta        = proj?.metadata ?? {};
  const concepts    = meta.concepts ?? [];
  const selIdx      = meta.selectedConceptIdx ?? 0;
  const concept     = concepts[selIdx] as Concept | undefined;
  const palette     = concept?.palette ?? [];
  const siteAn      = proj?.siteAnalysis as SiteAnalysis | undefined;
  const program     = proj?.program as { floors?: ProgramFloor[] } | undefined;
  const zoning      = meta.zoning?.nodes ?? [];
  const interior    = meta.interior as Interior | undefined;
  const exterior    = meta.exterior as Exterior | undefined;
  const brief       = meta.brief as Brief | undefined;
  const regs        = (meta as Record<string, unknown>).regulations as Regulations | undefined;
  const lobbyImg    = interior?.spaces?.lobby?.imageUrl;

  /* total GFA */
  const floors = program?.floors ?? [];
  const totalGFA = floors.reduce((sum, f) => sum + (f.areaPerFloor || 0), 0);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Final Presentation</h1>
          <p className="text-sm text-muted-foreground font-mono">Architectural poster board — compiled from project intelligence.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      {/* ───── POSTER ───── */}
      <div
        id="poster-board"
        className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: "#0b0b0f", fontFamily: "'Space Mono', monospace" }}
      >
        {/* ── HEADER STRIP ── */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #1a1208 0%, #0f0f18 60%, #0b0b0f 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-mono text-amber-400/70 uppercase tracking-[0.3em] mb-0.5">ARCHI HUB · Final Presentation</p>
            <h2 className="text-2xl font-bold text-white leading-tight truncate">{proj?.name ?? "PROJECT"}</h2>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{proj?.projectType} {proj?.address ? `· ${proj.address}` : ""}</p>
          </div>
          {concept && (
            <div className="hidden sm:block text-right shrink-0 max-w-xs">
              <p className="text-[9px] font-mono text-amber-400/60 uppercase tracking-widest mb-0.5">Design Concept</p>
              <p className="text-base font-bold text-white">{concept.title}</p>
              {palette.length > 0 && <PaletteBar colors={palette} />}
            </div>
          )}
          <div className="hidden md:grid grid-cols-3 gap-3 shrink-0">
            {[
              { label: "Site Area", value: proj?.siteArea ? `${proj.siteArea.toLocaleString()} m²` : undefined },
              { label: "Floors",    value: proj?.numFloors ? `${proj.numFloors} FL` : undefined },
              { label: "GFA",       value: totalGFA ? `${totalGFA.toLocaleString()} m²` : undefined },
            ].filter(s => s.value).map(s => (
              <div key={s.label} className="text-center border border-white/10 rounded px-3 py-1.5">
                <p className="text-[8px] font-mono text-white/35 uppercase tracking-widest">{s.label}</p>
                <p className="text-sm font-bold text-amber-400">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROW 1: OVERVIEW + SITE MAP + VISUALISATION ── */}
        <div className="grid grid-cols-12 gap-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

          {/* OVERVIEW — left column */}
          <div className="col-span-12 md:col-span-4 px-5 py-5 space-y-4" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <PosterSection title="Overview">
              {concept?.narrative ? (
                <p className="text-[10px] text-white/70 leading-relaxed italic border-l-2 border-amber-400/30 pl-2">{concept.narrative}</p>
              ) : (
                <p className="text-[10px] text-white/30 italic">No concept generated yet.</p>
              )}
            </PosterSection>

            {/* concept tags */}
            {(concept?.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {concept!.tags.map((t, i) => <Badge key={i} label={t} />)}
              </div>
            )}

            {/* project key facts */}
            <PosterSection title="Project Facts">
              <Stat label="Type"      value={proj?.projectType} />
              <Stat label="Location"  value={proj?.address} />
              <Stat label="Site Area" value={proj?.siteArea ? `${proj.siteArea.toLocaleString()} m²` : undefined} />
              <Stat label="Floors"    value={proj?.numFloors} />
              <Stat label="GFA"       value={totalGFA ? `${totalGFA.toLocaleString()} m²` : undefined} />
              <Stat label="Status"    value={proj?.status} />
            </PosterSection>

            {/* exterior style */}
            {exterior?.styleDirection && (
              <PosterSection title="Exterior Direction">
                <DotNote text={exterior.styleDirection} lines={3} />
                {exterior.primaryMaterial && (
                  <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                    <p className="text-[8px] font-mono text-amber-400/60 uppercase tracking-wider mb-0.5">Primary Material</p>
                    <p className="text-[9px] text-white/70">{exterior.primaryMaterial.name} · {exterior.primaryMaterial.finish}</p>
                  </div>
                )}
              </PosterSection>
            )}

            {/* palette */}
            {palette.length > 0 && (
              <PosterSection title="Concept Palette">
                <PaletteBar colors={palette} />
                <div className="flex justify-between mt-1">
                  {palette.slice(0, 5).map((c, i) => (
                    <span key={i} className="text-[7px] font-mono text-white/30">{c}</span>
                  ))}
                </div>
              </PosterSection>
            )}
          </div>

          {/* SITE MAP + VISUALISATION — right 8 cols */}
          <div className="col-span-12 md:col-span-8 flex flex-col">
            {/* map area */}
            <div className="relative flex-1" style={{ minHeight: 220, background: "#0d1117" }}>
              {/* Map grid overlay — simulated site plan */}
              <div className="absolute inset-0 overflow-hidden">
                {/* grid lines */}
                <svg width="100%" height="100%" className="opacity-[0.06]">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
                {/* site boundary */}
                <svg className="absolute inset-0 w-full h-full">
                  {/* surrounding context blocks */}
                  <rect x="8%" y="10%" width="22%" height="18%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="35%" y="5%" width="28%" height="14%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="68%" y="8%" width="20%" height="20%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="10%" y="35%" width="18%" height="28%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="65%" y="33%" width="24%" height="22%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="12%" y="68%" width="26%" height="18%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <rect x="60%" y="62%" width="28%" height="20%" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  {/* site footprint — highlighted */}
                  <rect x="32%" y="30%" width="32%" height="34%" rx="3" fill="rgba(217,119,6,0.08)" stroke="rgba(217,119,6,0.5)" strokeWidth="1.5" />
                  {/* site cross/target */}
                  <line x1="48%" y1="28%" x2="48%" y2="66%" stroke="rgba(217,119,6,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="30%" y1="47%" x2="66%" y2="47%" stroke="rgba(217,119,6,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
                  {/* sun arrow */}
                  <line x1="80%" y1="15%" x2="68%" y2="32%" stroke="rgba(251,191,36,0.5)" strokeWidth="1" markerEnd="url(#arrow-sun)" />
                  {/* wind arrow */}
                  <line x1="5%" y1="45%" x2="18%" y2="47%" stroke="rgba(99,179,237,0.5)" strokeWidth="1" markerEnd="url(#arrow-wind)" />
                  <defs>
                    <marker id="arrow-sun" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                      <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(251,191,36,0.7)" />
                    </marker>
                    <marker id="arrow-wind" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                      <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(99,179,237,0.7)" />
                    </marker>
                  </defs>
                  {/* north arrow */}
                  <text x="92%" y="92%" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">N↑</text>
                  {/* site label */}
                  <text x="48%" y="47%" textAnchor="middle" fill="rgba(217,119,6,0.9)" fontSize="8" fontFamily="monospace" fontWeight="bold">SITE</text>
                </svg>
                {/* overlay labels */}
                <div className="absolute top-2 left-2 space-y-0.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-amber-500/70" /><span className="text-[7px] font-mono text-white/40">Site boundary</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-yellow-400/50" style={{ borderTop: "1px dashed" }} /><span className="text-[7px] font-mono text-white/40">Sun path</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-blue-400/50" style={{ borderTop: "1px dashed" }} /><span className="text-[7px] font-mono text-white/40">Wind direction</span></div>
                </div>
                {/* coordinates */}
                {(proj?.latitude && proj?.longitude) && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[7px] font-mono text-white/25">{proj.latitude.toFixed(4)}°N, {proj.longitude.toFixed(4)}°E</span>
                  </div>
                )}
                {/* site analysis callouts on map */}
                {siteAn?.sunExposure && (
                  <div className="absolute top-2 right-12 bg-yellow-900/50 border border-yellow-500/20 rounded px-1.5 py-0.5">
                    <p className="text-[7px] font-mono text-yellow-400">☀ {short(siteAn.sunExposure, 30)}</p>
                  </div>
                )}
                {siteAn?.windDirection && (
                  <div className="absolute top-2 left-1/4 bg-blue-900/40 border border-blue-400/20 rounded px-1.5 py-0.5">
                    <p className="text-[7px] font-mono text-blue-300">↗ {short(siteAn.windDirection, 25)}</p>
                  </div>
                )}
                {siteAn?.climate && (
                  <div className="absolute bottom-2 right-2 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 max-w-[200px]">
                    <p className="text-[7px] font-mono text-white/50 truncate">{short(siteAn.climate, 35)}</p>
                  </div>
                )}
              </div>
              {/* map section title */}
              <div className="absolute inset-x-0 top-0 px-3 py-1.5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[8px] font-mono text-amber-400/60 uppercase tracking-widest">Site Plan & Analysis Overlay</span>
                <span className="text-[7px] font-mono text-white/25">1:500</span>
              </div>
            </div>

            {/* exterior image strip or site analysis summary */}
            <div className="grid grid-cols-2 gap-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {/* context study */}
              <div className="px-4 py-3 space-y-2" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <PosterSection title="Context Study">
                  {siteAn?.surroundingContext
                    ? <DotNote text={siteAn.surroundingContext} lines={2} />
                    : <p className="text-[9px] text-white/25">—</p>}
                  {siteAn?.topography && <DotNote text={`Topography: ${short(siteAn.topography, 60)}`} lines={2} />}
                </PosterSection>
              </div>
              {/* site analysis */}
              <div className="px-4 py-3 space-y-2">
                <PosterSection title="Site Analysis">
                  {siteAn?.opportunities && <DotNote text={`↑ ${siteAn.opportunities}`} lines={2} />}
                  {siteAn?.constraints    && <DotNote text={`↓ ${siteAn.constraints}`} lines={2} />}
                  {siteAn?.zoningInfo     && <DotNote text={`Zone: ${short(siteAn.zoningInfo, 60)}`} lines={2} />}
                  {siteAn?.sustainabilityScore !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] font-mono text-white/35 uppercase">Sustain. Score</span>
                      <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
                        <div className="h-full bg-green-500/70 rounded" style={{ width: `${(siteAn.sustainabilityScore / 10) * 100}%` }} />
                      </div>
                      <span className="text-[8px] font-mono text-green-400">{siteAn.sustainabilityScore}/10</span>
                    </div>
                  )}
                </PosterSection>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: PROGRAM + ZONING | INTERIOR | CODES ── */}
        <div className="grid grid-cols-12 gap-0">

          {/* PROGRAM + ZONING */}
          <div className="col-span-12 md:col-span-4 px-5 py-4 space-y-4" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <PosterSection title="Program & Zoning">
              {floors.length > 0 ? (
                <div className="space-y-0.5">
                  {/* header */}
                  <div className="grid grid-cols-3 gap-1 pb-1 border-b border-white/10">
                    {["Function", "Level", "Area (m²)"].map(h => (
                      <span key={h} className="text-[7px] font-mono text-white/30 uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  {floors.slice(0, 10).map((f, i) => (
                    <div key={i} className="grid grid-cols-3 gap-1 py-0.5 border-b border-white/5">
                      <span className="text-[8px] font-mono text-white/60 truncate">{f.functionName}</span>
                      <span className="text-[8px] font-mono text-white/40 text-center">FL {f.floor}</span>
                      <span className="text-[8px] font-mono text-amber-400/80 text-right">{f.areaPerFloor?.toLocaleString()}</span>
                    </div>
                  ))}
                  {floors.length > 10 && (
                    <p className="text-[7px] font-mono text-white/25 pt-1">+{floors.length - 10} more levels</p>
                  )}
                  {totalGFA > 0 && (
                    <div className="flex justify-between border-t border-amber-500/20 pt-1 mt-1">
                      <span className="text-[8px] font-mono text-amber-400/60 uppercase">Total GFA</span>
                      <span className="text-[9px] font-mono font-bold text-amber-400">{totalGFA.toLocaleString()} m²</span>
                    </div>
                  )}
                </div>
              ) : <p className="text-[9px] text-white/25">No program generated yet.</p>}
            </PosterSection>

            {zoning.length > 0 && (
              <PosterSection title="Zoning Breakdown">
                <div className="space-y-1">
                  {zoning.slice(0, 8).map((n, i) => {
                    const total = zoning.reduce((s, z) => s + (z.totalArea || 0), 0);
                    const pct   = total ? Math.round((n.totalArea / total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono text-white/55 truncate">{n.zone}</span>
                          <span className="text-[8px] font-mono text-white/40">{pct}%</span>
                        </div>
                        <div className="h-0.5 bg-white/10 rounded overflow-hidden">
                          <div className="h-full bg-amber-500/60 rounded" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PosterSection>
            )}

            {brief && (
              <PosterSection title="Client Brief">
                {(brief.styles ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {brief.styles!.map((s, i) => <Badge key={i} label={s} />)}
                  </div>
                )}
                {brief.mustHave && <DotNote text={`Must have: ${brief.mustHave}`} />}
                {brief.avoid    && <DotNote text={`Avoid: ${brief.avoid}`} />}
              </PosterSection>
            )}
          </div>

          {/* INTERIOR PREFERENCE */}
          <div className="col-span-12 md:col-span-4 px-5 py-4 space-y-4" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <PosterSection title="Interior Preference">
              {interior?.selectedStyle ? (
                <div className="space-y-3">
                  <div className="p-2 bg-amber-900/10 border border-amber-500/15 rounded">
                    <p className="text-[8px] font-mono text-amber-400/60 uppercase tracking-wider mb-0.5">Style</p>
                    <p className="text-[10px] font-mono font-bold text-white">{interior.selectedStyle}</p>
                  </div>
                  {interior.styleDescription && (
                    <p className="text-[9px] text-white/55 leading-relaxed">{interior.styleDescription}</p>
                  )}
                  {(interior.materialPalette?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Materials</p>
                      {interior.materialPalette!.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex gap-2 items-start border-b border-white/5 pb-1">
                          <span className="text-[7px] font-mono text-amber-400/50 uppercase w-10 shrink-0">{m.role}</span>
                          <div>
                            <p className="text-[8px] font-mono text-white/70">{m.name}</p>
                            <p className="text-[7px] text-white/35 leading-snug">{m.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {interior.spaces?.lobby && (
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Lobby</p>
                      {interior.spaces.lobby.keyFeature && <DotNote text={interior.spaces.lobby.keyFeature} />}
                      {interior.spaces.lobby.lightingMood && <DotNote text={`Lighting: ${interior.spaces.lobby.lightingMood}`} />}
                      {interior.spaces.lobby.primaryFinish && <DotNote text={`Finish: ${interior.spaces.lobby.primaryFinish}`} />}
                    </div>
                  )}
                  {interior.ffStrategy && (
                    <div>
                      <p className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-1">FF&E</p>
                      <DotNote text={interior.ffStrategy} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-[9px] text-white/25">No interior spec generated yet.</p>
                </div>
              )}
            </PosterSection>

            {/* lobby interior visualisation thumbnail */}
            {lobbyImg && (
              <PosterSection title="Lobby Visualisation">
                <div className="relative rounded overflow-hidden border border-white/10">
                  <img src={lobbyImg} alt="Lobby" className="w-full object-cover" style={{ maxHeight: 180 }} />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <p className="text-[7px] font-mono text-white/60 uppercase tracking-widest">AI Visualisation · Lobby</p>
                  </div>
                </div>
              </PosterSection>
            )}
          </div>

          {/* CODES */}
          <div className="col-span-12 md:col-span-4 px-5 py-4 space-y-4">
            <PosterSection title="Code & Regulations">
              {regs ? (
                <div className="space-y-2">
                  <Stat label="Height Limit"   value={regs.heightLimit} />
                  <Stat label="Setbacks"        value={regs.setbacks} />
                  <Stat label="FAR / Plot Ratio" value={regs.farRatio} />
                  <Stat label="Parking"         value={regs.parkingRequirement} />
                  {regs.accessibilityNotes && <DotNote text={regs.accessibilityNotes} />}
                  {regs.specialConditions  && <DotNote text={regs.specialConditions} />}
                </div>
              ) : (
                <p className="text-[9px] text-white/25">No regulations loaded yet.</p>
              )}
            </PosterSection>

            {siteAn?.zoningInfo && (
              <PosterSection title="Zoning Classification">
                <DotNote text={siteAn.zoningInfo} lines={3} />
              </PosterSection>
            )}

            {siteAn?.sustainabilityScore !== undefined && (
              <PosterSection title="Sustainability">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full border-2 border-green-500/50 flex items-center justify-center shrink-0"
                    style={{ background: `conic-gradient(rgba(34,197,94,0.6) ${(siteAn.sustainabilityScore / 10) * 360}deg, rgba(255,255,255,0.05) 0)` }}
                  >
                    <span className="text-sm font-bold text-green-400">{siteAn.sustainabilityScore}</span>
                  </div>
                  <div>
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Score / 10</p>
                    <p className="text-[9px] text-white/55 leading-relaxed">LEED-oriented performance baseline.</p>
                  </div>
                </div>
              </PosterSection>
            )}

            {/* concept materials */}
            {(concept?.materials?.length ?? 0) > 0 && (
              <PosterSection title="Key Materials">
                <div className="flex flex-wrap gap-1">
                  {concept!.materials.slice(0, 6).map((m, i) => <Badge key={i} label={m} />)}
                </div>
              </PosterSection>
            )}

            {/* concept tags */}
            {(concept?.tags?.length ?? 0) > 0 && (
              <PosterSection title="Design Tags">
                <div className="flex flex-wrap gap-1">
                  {concept!.tags.map((t, i) => <Badge key={i} label={t} />)}
                </div>
              </PosterSection>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="px-6 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
        >
          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Archi Hub · AI-Powered Architectural Design Platform</span>
          <span className="text-[7px] font-mono text-white/15">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
      </div>

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
