import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Compass, Box, Map, CheckCircle2, FileText, Image as ImageIcon, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Archi Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/projects/new">
              <Button>Start Project</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10" />
            <div className="w-full h-full opacity-20" style={{ backgroundImage: "linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />
          </div>
          
          <div className="container mx-auto max-w-5xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6">
                Your AI <br/><span className="text-primary">Architectural</span> <br/>Design Hub
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                From site analysis to concept, massing, and visualization — powered by intelligent design agents.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link href="/projects/new">
                  <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-xl shadow-primary/20">
                    Start Your Project <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
                  See How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">What is Archi Hub?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A digital studio that augments your design intelligence.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Map, title: "Contextual Intelligence", desc: "Automated analysis of site conditions, urban fabric, and climate data." },
                { icon: Box, title: "Generative Massing", desc: "Instantly explore volumetric configurations based on zoning and program." },
                { icon: ImageIcon, title: "Instant Visualization", desc: "Transform concepts into presentation-ready visuals in seconds." }
              ].map((feature, i) => (
                <Card key={i} className="bg-background border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-8">
                    <feature.icon className="w-10 h-10 text-primary mb-6" />
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">The Design Process</h2>
            
            <div className="space-y-12">
              {[
                "Discovery & Site Selection",
                "Client Understanding & Brief",
                "Architectural Intelligence & Programming",
                "Design Creation & Massing",
                "Evaluation & Sustainability",
                "Presentation & Export"
              ].map((step, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-mono font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {i + 1}
                    </div>
                    {i < 5 && <div className="w-px h-16 bg-border/50 group-hover:bg-primary/30 transition-colors" />}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold">{step}</h3>
                    <p className="text-muted-foreground mt-1">Structured workflows guided by domain-specific AI agents.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Agents */}
        <section className="py-24 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">Meet Your Design Agents</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Site Agent", mission: "Analyzes topography, climate, and urban context.", icon: Compass },
                { name: "Concept Agent", mission: "Generates narratives and formal strategies.", icon: Lightbulb },
                { name: "Exterior Agent", mission: "Develops facades and material articulation.", icon: Building2 },
                { name: "Interior Agent", mission: "Plans spatial layouts and lighting moods.", icon: Sofa },
                { name: "Landscape Agent", mission: "Integrates built form with natural systems.", icon: Trees },
                { name: "Visualization Agent", mission: "Renders photorealistic imagery.", icon: ImageIcon }
              ].map((agent, i) => (
                <Card key={i} className="bg-background">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <agent.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.mission}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-6">Ready to Build?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Initialize your first project and experience the future of architectural workflow.
          </p>
          <Link href="/projects/new">
            <Button size="lg" className="h-14 px-10 text-lg">Start Building Your Vision</Button>
          </Link>
        </section>
      </main>
      
      <footer className="py-8 border-t border-border/50 text-center text-muted-foreground text-sm font-mono">
        &copy; {new Date().getFullYear()} Archi Hub. Built for visionaries.
      </footer>
    </div>
  );
}
