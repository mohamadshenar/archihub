import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useUpdateProjectSite
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowNav } from "@/components/workflow-nav";

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ProjectSite() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { mutate: updateSite, isPending } = useUpdateProjectSite();

  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState("");
  const [siteArea, setSiteArea] = useState("");
  const initRef = useRef(false);

  useEffect(() => {
    if (project && !initRef.current) {
      if (project.latitude && project.longitude) {
        setPosition({ lat: project.latitude, lng: project.longitude });
      } else {
        // Default to a generic view
        setPosition({ lat: 40.7128, lng: -74.0060 });
      }
      if (project.address) setAddress(project.address);
      if (project.siteArea) setSiteArea(project.siteArea.toString());
      initRef.current = true;
    }
  }, [project]);

  const handleSave = () => {
    if (!position) return;
    
    updateSite(
      { 
        id: projectId, 
        data: { 
          latitude: position.lat, 
          longitude: position.lng,
          address: address || undefined,
          siteArea: siteArea ? parseFloat(siteArea) : undefined
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({
            title: "Site Location Saved",
            description: "Geographic coordinates established successfully."
          });
        }
      }
    );
  };

  if (isLoading || !position) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Selection</h1>
          <p className="text-sm text-muted-foreground font-mono">Define the physical constraints.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Location Details</CardTitle>
            <CardDescription>Click on the map to set coordinates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Coordinates</Label>
              <div className="flex gap-2 text-sm font-mono bg-muted p-2 rounded items-center">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Context / Address</Label>
              <Input 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="e.g. 123 Industrial Ave"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Site Area (sqm)</Label>
              <Input 
                id="area" 
                type="number" 
                value={siteArea} 
                onChange={(e) => setSiteArea(e.target.value)} 
                placeholder="e.g. 5000"
              />
            </div>

            <Button className="w-full mt-4" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lock Coordinates
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 overflow-hidden h-[600px] border-border/50">
          <div className="h-full w-full relative z-0">
            <MapContainer 
              center={[position.lat, position.lng]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
              />
              <Marker position={[position.lat, position.lng]} />
              <MapEvents onLocationSelect={(lat, lng) => setPosition({lat, lng})} />
            </MapContainer>
            {/* Overlay to give a dark tint to the map */}
            <div className="absolute inset-0 pointer-events-none bg-background/10 mix-blend-saturation z-10"></div>
          </div>
        </Card>
      </div>
      <WorkflowNav projectId={projectId} />
    </div>
  );
}
