import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useUpdateProjectQuestionnaire,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useRef } from "react";

const questionnaireSchema = z.object({
  totalAreaNeeded: z.string().min(1, "Required"),
  floors: z.string().min(1, "Required"),
  style: z.string().min(1, "Required"),
  budget: z.string().min(1, "Required"),
  timeline: z.string().min(1, "Required"),
  specialFeatures: z.string().optional(),
});

export default function ProjectQuestionnaire() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { mutate: saveAnswers, isPending } = useUpdateProjectQuestionnaire();

  const form = useForm<z.infer<typeof questionnaireSchema>>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      totalAreaNeeded: "",
      floors: "",
      style: "",
      budget: "",
      timeline: "",
      specialFeatures: "",
    },
  });

  const initRef = useRef(false);

  useEffect(() => {
    if (project?.questionnaire?.answers && !initRef.current) {
      const a = project.questionnaire.answers as any;
      form.reset({
        totalAreaNeeded: a.totalAreaNeeded || "",
        floors: a.floors || "",
        style: a.style || "",
        budget: a.budget || "",
        timeline: a.timeline || "",
        specialFeatures: a.specialFeatures || "",
      });
      initRef.current = true;
    }
  }, [project, form]);

  const onSubmit = (values: z.infer<typeof questionnaireSchema>) => {
    saveAnswers(
      { id: projectId, data: { answers: values } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({
            title: "Requirements Saved",
            description: "Client parameters stored successfully."
          });
        }
      }
    );
  };

  if (isLoading) return <div className="p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!project) return <div>Not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Needs Questionnaire</h1>
            <p className="text-sm text-muted-foreground font-mono">Define functional and aesthetic constraints.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">Spatial Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAreaNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Area (sqm)</FormLabel>
                        <FormControl><Input placeholder="e.g. 250" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Floors</FormLabel>
                        <FormControl><Input placeholder="e.g. 2" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">Aesthetic Direction</h3>
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Architectural Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select style..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="modern">Modern Minimalist</SelectItem>
                          <SelectItem value="contemporary">Contemporary</SelectItem>
                          <SelectItem value="industrial">Brutalist / Industrial</SelectItem>
                          <SelectItem value="sustainable">Eco / Sustainable</SelectItem>
                          <SelectItem value="traditional">Traditional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">Logistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Estimate</FormLabel>
                        <FormControl><Input placeholder="e.g. $500k - $750k" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Timeline</FormLabel>
                        <FormControl><Input placeholder="e.g. 12 months" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">Additional</h3>
                <FormField
                  control={form.control}
                  name="specialFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe any unique features, accessibility needs, or specific materials..." className="min-h-24 resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Commit Requirements
                </Button>
                {project.status === "analyzed" || project.status === "programmed" ? (
                  <Link href={`/projects/${projectId}/program`}>
                    <Button variant="outline" type="button">
                      Proceed to Program <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
