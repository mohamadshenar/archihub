import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save, ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useProjectMission } from "@/hooks/use-project-mission";
import { WorkflowNav } from "@/components/workflow-nav";

const STYLES = ["Modern", "Minimal", "Industrial", "Organic", "Parametric", "Classical", "Brutalist", "Tropical"];
const SUSTAINABILITY_OPTS = ["LEED Certification", "Net-Zero Energy", "Passive Ventilation", "Rainwater Harvesting", "Green Roof", "High-Performance Glazing"];

interface BriefData {
  spaceTypes: string;
  adjacencies: string;
  specialActivities: string;
  mustHave: string;
  avoid: string;
  budgetPriority: number;
  styles: string[];
  sustainability: string[];
}

const DEFAULT: BriefData = {
  spaceTypes: "Primary exhibition hall, administrative offices, loading dock, public lobby, mechanical room.",
  adjacencies: "Loading dock must be directly connected to exhibition hall. Admin offices require secure separation from public lobby.",
  specialActivities: "Evening galas, heavy equipment delivery, high-security art transit.",
  mustHave: "Natural light, exposed concrete, durable flooring, double-height atrium.",
  avoid: "Drop ceilings, carpet, overly complex geometries, enclosed corridors.",
  budgetPriority: 70,
  styles: ["Modern", "Industrial"],
  sustainability: ["LEED Certification", "Passive Ventilation"],
};

export default function ProjectBrief() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();
  const { data, setData, save, isSaving, saved } = useProjectMission<BriefData>(projectId, "brief", DEFAULT);

  const toggleStyle = (s: string) =>
    setData((d) => ({ ...d, styles: d.styles.includes(s) ? d.styles.filter((x) => x !== s) : [...d.styles, s] }));

  const toggleSustainability = (s: string) =>
    setData((d) => ({ ...d, sustainability: d.sustainability.includes(s) ? d.sustainability.filter((x) => x !== s) : [...d.sustainability, s] }));

  const handleSave = async () => {
    await save();
    toast({ title: "Brief Saved", description: "Client brief compiled and stored to project." });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Brief</h1>
          <p className="text-sm text-muted-foreground font-mono">Capture functional and strategic requirements.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
            <ClipboardList className="w-3 h-3" /> Brief Agent — Ready
          </span>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saved ? "Saved" : "Save Brief"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Functional Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Core Space Types</Label>
                <Textarea
                  className="min-h-24 resize-none"
                  value={data.spaceTypes}
                  onChange={(e) => setData((d) => ({ ...d, spaceTypes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Critical Adjacencies</Label>
                <Textarea
                  className="min-h-24 resize-none"
                  value={data.adjacencies}
                  onChange={(e) => setData((d) => ({ ...d, adjacencies: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Special Activities</Label>
                <Textarea
                  className="min-h-20 resize-none"
                  value={data.specialActivities}
                  onChange={(e) => setData((d) => ({ ...d, specialActivities: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Strategic Goals</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Budget Priority</Label>
                  <span className="text-sm font-mono text-primary">{data.budgetPriority}% Quality-Driven</span>
                </div>
                <Slider
                  value={[data.budgetPriority]}
                  onValueChange={([v]) => setData((d) => ({ ...d, budgetPriority: v }))}
                  max={100} step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Economy</span>
                  <span>Premium</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Style References</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <Badge
                      key={s}
                      variant={data.styles.includes(s) ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleStyle(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Must-Haves</Label>
                  <Textarea
                    className="min-h-20 resize-none"
                    value={data.mustHave}
                    onChange={(e) => setData((d) => ({ ...d, mustHave: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avoid List</Label>
                  <Textarea
                    className="min-h-20 resize-none"
                    value={data.avoid}
                    onChange={(e) => setData((d) => ({ ...d, avoid: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sustainability Targets</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {SUSTAINABILITY_OPTS.map((s) => (
                <div key={s} className="flex items-center space-x-2">
                  <Checkbox
                    id={s}
                    checked={data.sustainability.includes(s)}
                    onCheckedChange={() => toggleSustainability(s)}
                  />
                  <Label htmlFor={s} className="font-normal cursor-pointer">{s}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-primary" />
                Brief Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Style Direction</span>
                <p className="font-medium mt-1">{data.styles.join(", ") || "Not selected"}</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Budget Priority</span>
                <p className="mt-1">{data.budgetPriority}% toward design quality</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Sustainability Goals</span>
                <p className="mt-1">{data.sustainability.length > 0 ? data.sustainability.join(", ") : "None selected"}</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Must Avoid</span>
                <p className="mt-1 text-muted-foreground">{data.avoid || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
