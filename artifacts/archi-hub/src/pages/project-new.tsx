import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { 
  useCreateProject,
  CreateProjectBodyProjectType,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  projectType: z.nativeEnum(CreateProjectBodyProjectType),
  numFloors: z.coerce.number().int().positive().optional().or(z.literal("")),
});

export default function NewProject() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { mutate: createProject, isPending } = useCreateProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      projectType: CreateProjectBodyProjectType.residential,
      numFloors: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const numFloors = values.numFloors === "" ? undefined : Number(values.numFloors);
    createProject(
      { data: { name: values.name, description: values.description, projectType: values.projectType, numFloors } },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setLocation(`/projects/${project.id}`);
        },
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground mt-2 font-mono text-sm">Initialize a new architectural context.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Define the core parameters for the new structure.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nexus Tower" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typology</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CreateProjectBodyProjectType.residential}>Residential</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.commercial}>Commercial</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.tower_commercial}>Tower – Commercial</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.tower_residential}>Tower – Residential</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.cultural}>Cultural</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.industrial}>Industrial</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.mixed_use}>Mixed Use</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.landscape}>Landscape</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.hospitality}>Hospitality / Hotel</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.civic}>Civic & Institutional</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.healthcare}>Healthcare</SelectItem>
                          <SelectItem value={CreateProjectBodyProjectType.education}>Education</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Floors</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="e.g. 42"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief / Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the overarching vision..." 
                        className="min-h-32 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Initialize Project
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
