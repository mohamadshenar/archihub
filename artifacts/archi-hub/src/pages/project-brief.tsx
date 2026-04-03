import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function ProjectBrief() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Brief Saved",
      description: "Client brief compiled and stored."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Brief</h1>
          <p className="text-sm text-muted-foreground font-mono">Capture functional and strategic requirements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Core Space Types</Label>
                <Textarea placeholder="e.g. Open plan office, 3 meeting rooms, cafeteria..." className="min-h-24 resize-none" defaultValue="Primary exhibition hall, administrative offices, loading dock, public lobby, mechanical room." />
              </div>
              <div className="space-y-2">
                <Label>Critical Adjacencies</Label>
                <Textarea placeholder="e.g. Kitchen next to dining..." className="min-h-24 resize-none" defaultValue="Loading dock must be directly connected to exhibition hall. Admin offices require secure separation from public lobby." />
              </div>
              <div className="space-y-2">
                <Label>Special Activities</Label>
                <Textarea placeholder="e.g. Large gatherings, workshops..." className="min-h-24 resize-none" defaultValue="Evening galas, heavy equipment delivery, high-security art transit." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategic Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Budget Priority</Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">Economy</span>
                  <Slider defaultValue={[70]} max={100} step={1} className="flex-1" />
                  <span className="text-xs font-mono text-muted-foreground">Premium</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Style References</Label>
                <div className="flex flex-wrap gap-2">
                  {["Modern", "Minimal", "Industrial", "Organic", "Parametric", "Classical", "Brutalist"].map((style, i) => (
                    <Badge key={i} variant={i === 2 || i === 0 ? "default" : "outline"} className="cursor-pointer">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Must-Haves</Label>
                  <Textarea className="min-h-20" defaultValue="Natural light, exposed concrete, durable flooring" />
                </div>
                <div className="space-y-2">
                  <Label>Avoid List</Label>
                  <Textarea className="min-h-20" defaultValue="Drop ceilings, carpet, overly complex geometries" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sustainability Targets</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="leed" defaultChecked />
                <Label htmlFor="leed" className="font-normal">LEED Certification</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="netzero" />
                <Label htmlFor="netzero" className="font-normal">Net-Zero Energy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="passive" defaultChecked />
                <Label htmlFor="passive" className="font-normal">Passive Ventilation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rainwater" defaultChecked />
                <Label htmlFor="rainwater" className="font-normal">Rainwater Harvesting</Label>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleAction}>
            <Save className="w-4 h-4 mr-2" />
            Save Brief Document
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-primary" />
                Structured Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Project Type</span>
                <p className="font-medium mt-1">Cultural / Exhibition</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Primary Goal</span>
                <p className="mt-1">Flexible, highly durable space for large-scale installations with premium finishes.</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Style Direction</span>
                <p className="mt-1">Modern Industrial</p>
              </div>
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase">Key Constraints</span>
                <p className="mt-1">High ceiling clearance required. Heavy load bearing floors. Controlled natural lighting.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
