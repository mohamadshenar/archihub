import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { GlobalLayout, ProjectLayout } from "@/components/layout";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ProjectsList from "@/pages/projects";
import NewProject from "@/pages/project-new";
import ProjectDetail from "@/pages/project-detail";
import ProjectSite from "@/pages/project-site";
import ProjectAnalysis from "@/pages/project-analysis";
import ProjectProgram from "@/pages/project-program";

// New Pages (To be created)
import ProjectContext from "@/pages/project-context";
import ProjectBrief from "@/pages/project-brief";
import ProjectPersonality from "@/pages/project-personality";
import ProjectZoning from "@/pages/project-zoning";
import ProjectConcept from "@/pages/project-concept";
import ProjectMassing from "@/pages/project-massing";
import ProjectExterior from "@/pages/project-exterior";
import ProjectInterior from "@/pages/project-interior";
import ProjectLandscape from "@/pages/project-landscape";
import ProjectSustainability from "@/pages/project-sustainability";
import ProjectRegulations from "@/pages/project-regulations";
import ProjectPresentation from "@/pages/project-presentation";
import ProjectExport from "@/pages/project-export";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/dashboard">
        {() => (
          <GlobalLayout>
            <Dashboard />
          </GlobalLayout>
        )}
      </Route>
      <Route path="/projects">
        {() => (
          <GlobalLayout>
            <ProjectsList />
          </GlobalLayout>
        )}
      </Route>
      <Route path="/projects/new">
        {() => (
          <GlobalLayout>
            <NewProject />
          </GlobalLayout>
        )}
      </Route>

      <Route path="/projects/:id">
        {() => (
          <ProjectLayout>
            <ProjectDetail />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/site">
        {() => (
          <ProjectLayout>
            <ProjectSite />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/analysis">
        {() => (
          <ProjectLayout>
            <ProjectAnalysis />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/context">
        {() => (
          <ProjectLayout>
            <ProjectContext />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/brief">
        {() => (
          <ProjectLayout>
            <ProjectBrief />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/personality">
        {() => (
          <ProjectLayout>
            <ProjectPersonality />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/program">
        {() => (
          <ProjectLayout>
            <ProjectProgram />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/zoning">
        {() => (
          <ProjectLayout>
            <ProjectZoning />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/concept">
        {() => (
          <ProjectLayout>
            <ProjectConcept />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/massing">
        {() => (
          <ProjectLayout>
            <ProjectMassing />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/exterior">
        {() => (
          <ProjectLayout>
            <ProjectExterior />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/interior">
        {() => (
          <ProjectLayout>
            <ProjectInterior />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/landscape">
        {() => (
          <ProjectLayout>
            <ProjectLandscape />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/sustainability">
        {() => (
          <ProjectLayout>
            <ProjectSustainability />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/regulations">
        {() => (
          <ProjectLayout>
            <ProjectRegulations />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/presentation">
        {() => (
          <ProjectLayout>
            <ProjectPresentation />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:id/export">
        {() => (
          <ProjectLayout>
            <ProjectExport />
          </ProjectLayout>
        )}
      </Route>

      <Route>
        {() => (
          <GlobalLayout>
            <NotFound />
          </GlobalLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
