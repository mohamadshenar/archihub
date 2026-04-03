import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useGetProjectImages,
  getGetProjectImagesQueryKey,
  useGenerateProjectImage,
  GenerateImageBodyImageType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Loader2, Sparkles, Download, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function ProjectVisualization() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");

  const { data: project, isLoading: isProjectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { data: images, isLoading: isImagesLoading } = useGetProjectImages(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectImagesQueryKey(projectId) }
  });

  const { mutate: generateImage } = useGenerateProjectImage();

  const handleGenerate = (type: GenerateImageBodyImageType) => {
    setGeneratingType(type);
    generateImage(
      { 
        id: projectId, 
        data: { 
          imageType: type, 
          title: customTitle || `${type.charAt(0).toUpperCase() + type.slice(1)} Concept` 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectImagesQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setGeneratingType(null);
          setCustomTitle("");
          toast({
            title: "Render Complete",
            description: "New architectural imagery synthesized."
          });
        },
        onError: () => {
          setGeneratingType(null);
          toast({
            title: "Render Failed",
            description: "An error occurred during synthesis.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isProjectLoading || isImagesLoading) return <div className="p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!project) return <div>Not found</div>;

  const exteriorImages = images?.filter(i => i.imageType === "exterior") || [];
  const interiorImages = images?.filter(i => i.imageType === "interior") || [];
  const landscapeImages = images?.filter(i => i.imageType === "landscape") || [];
  // For aerial we'll just show empty for now unless it's mapped to exterior
  const aerialImages = images?.filter(i => i.imageType === "exterior") || []; 

  const ImageGrid = ({ items, type }: { items: any[], type: GenerateImageBodyImageType }) => (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 bg-card p-4 border border-border rounded-lg">
        <div className="flex-1 w-full flex items-center gap-4">
           <Layers className="w-5 h-5 text-muted-foreground shrink-0" />
           <Input 
             placeholder="Optional render prompt override..." 
             value={customTitle}
             onChange={(e) => setCustomTitle(e.target.value)}
             className="max-w-md"
           />
        </div>
        <Button 
          onClick={() => handleGenerate(type)} 
          disabled={generatingType !== null}
          className="w-full sm:w-auto"
        >
          {generatingType === type ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Render {type}
        </Button>
      </div>

      {items.length === 0 && generatingType !== type ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-24 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No renders available</h3>
            <p className="text-muted-foreground text-sm font-mono mt-2">Initialize synthesis to generate visual concepts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {generatingType === type && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="overflow-hidden h-64 border-primary/50 bg-primary/5 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                    <span className="font-mono text-sm text-primary tracking-widest animate-pulse uppercase">Rendering</span>
                  </div>
                </Card>
              </motion.div>
            )}
            {items.map((image, i) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden group relative border-0 rounded-none bg-black">
                  <div className="aspect-[4/3] relative">
                    <img 
                      src={image.imageUrl} 
                      alt={image.prompt} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white font-mono text-xs line-clamp-3 mb-2">{image.prompt}</p>
                      <Button variant="secondary" size="sm" className="w-fit rounded-none font-mono text-xs" onClick={() => window.open(image.imageUrl, '_blank')}>
                        <Download className="w-3 h-3 mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visualization Studio</h1>
          <p className="text-sm text-muted-foreground font-mono">Photorealistic imagery and presentation renders.</p>
        </div>
      </div>

      <Tabs defaultValue="exterior" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-1">
          <TabsTrigger value="exterior" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Exterior</TabsTrigger>
          <TabsTrigger value="interior" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Interior</TabsTrigger>
          <TabsTrigger value="landscape" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Landscape</TabsTrigger>
          <TabsTrigger value="aerial" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Aerial</TabsTrigger>
        </TabsList>
        <TabsContent value="exterior">
          <ImageGrid items={exteriorImages} type="exterior" />
        </TabsContent>
        <TabsContent value="interior">
          <ImageGrid items={interiorImages} type="interior" />
        </TabsContent>
        <TabsContent value="landscape">
          <ImageGrid items={landscapeImages} type="landscape" />
        </TabsContent>
        <TabsContent value="aerial">
          <ImageGrid items={aerialImages} type="exterior" />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
