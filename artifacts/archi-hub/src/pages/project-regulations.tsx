import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function ProjectRegulations() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Compliance Check",
      description: "Scanning design against local building codes..."
    });
  };

  const CHECKS = [
    { name: "Setbacks & Clearances", status: "compliant", detail: "Front: 5m (Req 5m). Side: 3m (Req 3m). Rear: 10m (Req 8m)." },
    { name: "Height Restrictions", status: "compliant", detail: "Max height: 24m. Allowable: 30m. Zone overlay check passed." },
    { name: "FAR / Plot Ratio", status: "warning", detail: "Current FAR: 3.2. Allowable FAR: 3.0. Requires variance or mass reduction." },
    { name: "Parking Requirements", status: "compliant", detail: "Provided: 45 bays. Required: 40 bays based on GFA." },
    { name: "Accessibility (ADA/DDA)", status: "compliant", detail: "Ramp gradients < 1:12. Door clearances met. Accessible WCs per floor." },
    { name: "Fire Egress & Safety", status: "warning", detail: "Travel distance from North wing exceeds 45m maximum. Second stair core required." },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Code & Regulations</h1>
          <p className="text-sm text-muted-foreground font-mono">Automated compliance checking.</p>
        </div>
        <Button onClick={handleAction}>
          <FileText className="w-4 h-4 mr-2" />
          Run Full Scan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {CHECKS.map((check, i) => (
            <Card key={i} className={`overflow-hidden transition-colors ${check.status === 'warning' ? 'border-amber-500/50 bg-amber-500/5' : 'hover:border-border'}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {check.status === "compliant" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {check.status === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {check.status === "pending" && <HelpCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm">{check.name}</h4>
                    <Badge variant={check.status === 'compliant' ? 'outline' : 'secondary'} className={check.status === 'warning' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'text-green-500 border-green-500/30'}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{check.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Critical Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>The current design requires modifications to pass planning approval.</p>
              <div className="space-y-2">
                <Button size="sm" variant="destructive" className="w-full justify-start text-left h-auto py-2">
                  <span className="font-mono mr-2">1.</span> Reduce Floor Area by 250m²
                </Button>
                <Button size="sm" variant="destructive" className="w-full justify-start text-left h-auto py-2">
                  <span className="font-mono mr-2">2.</span> Add egress stair to North wing
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Local Jurisdiction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">City Planning Department</p>
              <p className="text-xs text-muted-foreground mt-1">Zoning Code: Industrial-Mixed (IM-2)</p>
              <p className="text-xs text-muted-foreground mt-1">Building Code: IBC 2021 Edition</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
