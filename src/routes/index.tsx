import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BarChart3, LineChart, Users, Upload, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crixsoft — YouTube Analytics Dashboard" },
      { name: "description", content: "Upload your YouTube exports and explore channel, video, keyword, and comparison analytics in a modern dashboard." },
      { property: "og:title", content: "Crixsoft — YouTube Analytics Dashboard" },
      { property: "og:description", content: "Upload your YouTube exports and explore channel, video, keyword, and comparison analytics." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">C</div>
            Crixsoft
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> YouTube Analytics · CSV powered
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Turn your YouTube exports into <span className="text-primary">actionable insight</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload channel and video CSVs from YouTube Studio and instantly explore growth, engagement,
          keywords, and side-by-side channel comparisons.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="gap-2">Get started free <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Upload, title: "CSV import", desc: "Drop in YouTube Studio exports — parsed and validated instantly." },
          { icon: BarChart3, title: "Channel overview", desc: "KPIs, subscriber and view growth, top videos at a glance." },
          { icon: LineChart, title: "Video analytics", desc: "Engagement rate, trends, and per-video deep-dives." },
          { icon: Users, title: "Compare channels", desc: "Side-by-side KPIs and overlaid growth curves." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 transition hover:shadow-lg">
            <f.icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Crixsoft
      </footer>
    </div>
  );
}
