import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileBox, FileImage, FileText, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WorkflowNav } from "@/components/workflow-nav";

export default function ProjectExport() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const { toast } = useToast();

  const handleAction = (file: string) => {
    toast({
      title: "Packaging Files",
      description: `Preparing ${file} for download...`
    });
  };

  const EXPORTS = [
    { name: "Concept Presentation Board", icon: FileImage, size: "24.5 MB", type: "PDF", date: "Today" },
    { name: "Site Analysis Report", icon: FileText, size: "4.2 MB", type: "PDF", date: "Today" },
    { name: "Client Brief & Program", icon: FileText, size: "1.8 MB", type: "PDF", date: "Yesterday" },
    { name: "High-Res Render Package", icon: FileImage, size: "142 MB", type: "ZIP", date: "Today" },
    { name: "Parametric Cost Estimate", icon: FileText, size: "0.5 MB", type: "XLSX", date: "Yesterday" },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Files</h1>
          <p className="text-sm text-muted-foreground font-mono">Download project deliverables and data.</p>
        </div>
        <Button onClick={() => handleAction("Full Project Package")} className="bg-primary text-primary-foreground">
          <Archive className="w-4 h-4 mr-2" />
          Download Full Project ZIP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map((item, i) => (
          <Card key={i} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-lg text-primary">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{item.size}</span>
                    <span>•</span>
                    <span>Generated {item.date}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleAction(item.name)}>
                <Download className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <WorkflowNav projectId={projectId} />
    </motion.div>
  );
}
