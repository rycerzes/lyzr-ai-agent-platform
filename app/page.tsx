import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            Lyzr AI
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            AI-Powered Customer Support
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create intelligent support agents, manage tickets, and embed chat widgets on any website.
            Powered by Lyzr AI for seamless customer experiences.
          </p>

          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row mb-16">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div id="features" className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                Intelligent Agents
              </h3>
              <p className="text-muted-foreground">
                Create AI-powered support agents that understand context and provide accurate responses to customer queries.
              </p>
            </div>

            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                Ticket Management
              </h3>
              <p className="text-muted-foreground">
                Streamline your support workflow with built-in ticket management and tracking capabilities.
              </p>
            </div>

            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                Easy Integration
              </h3>
              <p className="text-muted-foreground">
                Drop a chat widget onto any website with just a few lines of code. No technical expertise required.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
