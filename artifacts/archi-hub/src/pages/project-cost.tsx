import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function ProjectCost() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Cost Engine Active",
      description: "Recalculating parametric cost model..."
    });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Estimate</h1>
          <p className="text-sm text-muted-foreground font-mono">Parametric budget modeling and quantity takeoff.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export BOQ
          </Button>
          <Button onClick={handleAction}>
            <DollarSign className="w-4 h-4 mr-2" />
            Update Estimate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Estimated Total</CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">$14.2M</div>
            <p className="text-sm font-mono text-muted-foreground mb-6">± 15% accuracy</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span>Target Budget</span>
                <span>$15.0M</span>
              </div>
              <Progress value={94} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">6% under budget</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead className="text-right">Cost / m²</TableHead>
                  <TableHead className="text-right">Total ($)</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-sm">
                <TableRow>
                  <TableCell className="font-sans font-medium">Substructure / Foundation</TableCell>
                  <TableCell className="text-right">$450</TableCell>
                  <TableCell className="text-right">1,890,000</TableCell>
                  <TableCell className="text-right text-muted-foreground">13.3%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-sans font-medium">Superstructure</TableCell>
                  <TableCell className="text-right">$820</TableCell>
                  <TableCell className="text-right">3,444,000</TableCell>
                  <TableCell className="text-right text-muted-foreground">24.2%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-sans font-medium">Exterior Enclosure</TableCell>
                  <TableCell className="text-right">$950</TableCell>
                  <TableCell className="text-right">3,990,000</TableCell>
                  <TableCell className="text-right text-muted-foreground">28.1%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-sans font-medium">Interior Finishes</TableCell>
                  <TableCell className="text-right">$580</TableCell>
                  <TableCell className="text-right">2,436,000</TableCell>
                  <TableCell className="text-right text-muted-foreground">17.1%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-sans font-medium">MEP Services</TableCell>
                  <TableCell className="text-right">$510</TableCell>
                  <TableCell className="text-right">2,142,000</TableCell>
                  <TableCell className="text-right text-muted-foreground">15.1%</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
                  <TableCell className="font-sans">Total Direct Cost</TableCell>
                  <TableCell className="text-right">$3,310</TableCell>
                  <TableCell className="text-right">13,902,000</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
