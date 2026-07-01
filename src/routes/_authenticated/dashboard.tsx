import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Crixsoft" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: channels, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("id,name,handle,subscribers,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your channels</h1>
          <p className="text-sm text-muted-foreground">Upload CSVs to add or refresh a channel.</p>
        </div>
        <Link to="/upload">
          <Button><Plus className="mr-2 h-4 w-4" /> New upload</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !channels || channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-semibold">No channels yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a YouTube CSV to get started.</p>
          <Link to="/upload"><Button className="mt-4">Upload CSV</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <Link
              key={c.id}
              to="/c/$channelId/overview"
              params={{ channelId: c.id }}
              className="group rounded-2xl border bg-card p-6 transition hover:border-primary hover:shadow-lg"
            >
              <div className="text-lg font-semibold group-hover:text-primary">{c.name}</div>
              {c.handle && <div className="text-xs text-muted-foreground">{c.handle}</div>}
              <div className="mt-4 text-2xl font-bold">{(c.subscribers ?? 0).toLocaleString()}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">subscribers</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}