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
import { ArrowLeft, ImageIcon, Loader2, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectImages() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [generatingType, setGeneratingType] = useState<string | null>(null);

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
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Concept` 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectImagesQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setGeneratingType(null);
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

  const ImageGrid = ({ items, type }: { items: any[], type: GenerateImageBodyImageType }) => (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => handleGenerate(type)} 
          disabled={generatingType !== null}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {generatingType === type ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Synthesize {type}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Imagery Gallery</h1>
            <p className="text-sm text-muted-foreground font-mono">AI-generated architectural visualization.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exterior" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50 p-1">
          <TabsTrigger value="exterior" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Exterior</TabsTrigger>
          <TabsTrigger value="interior" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Interior</TabsTrigger>
          <TabsTrigger value="landscape" className="rounded-none font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Landscape</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
