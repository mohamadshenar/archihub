import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import Dashboard from "@/pages/dashboard";
import ProjectsList from "@/pages/projects";
import NewProject from "@/pages/project-new";
import ProjectDetail from "@/pages/project-detail";
import ProjectSite from "@/pages/project-site";
import ProjectAnalysis from "@/pages/project-analysis";
import ProjectQuestionnaire from "@/pages/project-questionnaire";
import ProjectProgram from "@/pages/project-program";
import ProjectImages from "@/pages/project-images";

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
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={ProjectsList} />
        <Route path="/projects/new" component={NewProject} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/projects/:id/site" component={ProjectSite} />
        <Route path="/projects/:id/analysis" component={ProjectAnalysis} />
        <Route path="/projects/:id/questionnaire" component={ProjectQuestionnaire} />
        <Route path="/projects/:id/program" component={ProjectProgram} />
        <Route path="/projects/:id/images" component={ProjectImages} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Apply dark mode by default for Archi Hub
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
