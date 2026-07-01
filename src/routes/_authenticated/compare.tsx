import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Kpi } from "@/components/kpi";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ title: "Compare — Crixsoft" }] }),
  component: ComparePage,
});

function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("id,name,subscribers");
      if (error) throw error;
      return data;
    },
  });

  const { data: agg = [] } = useQuery({
    queryKey: ["compare-agg", selected.join(",")],
    enabled: selected.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("channel_id,views,likes,comments")
        .in("channel_id", selected);
      if (error) throw error;
      return data;
    },
  });

  const stats = selected.map((id) => {
    const c = channels.find((x) => x.id === id);
    const rows = agg.filter((r) => r.channel_id === id);
    const views = rows.reduce((s, r) => s + (r.views ?? 0), 0);
    const likes = rows.reduce((s, r) => s + (r.likes ?? 0), 0);
    const comments = rows.reduce((s, r) => s + (r.comments ?? 0), 0);
    return { c, views, likes, comments, videos: rows.length, engagement: views ? ((likes + comments) / views) * 100 : 0 };
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="text-3xl font-bold">Compare channels</h1>
      <p className="text-sm text-muted-foreground">Pick 2–4 channels to see side-by-side stats.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {channels.map((c) => {
          const on = selected.includes(c.id);
          return (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 py-2">
              <Checkbox
                checked={on}
                onCheckedChange={(v) => {
                  setSelected((prev) =>
                    v ? (prev.length < 4 ? [...prev, c.id] : prev) : prev.filter((x) => x !== c.id),
                  );
                }}
              />
              {c.name}
            </label>
          );
        })}
        {channels.length === 0 && <p className="text-sm text-muted-foreground">Upload a channel first.</p>}
      </div>

      {stats.length > 0 && (
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
          {stats.map((s) => (
            <div key={s.c?.id} className="rounded-2xl border bg-card p-6">
              <div className="text-lg font-semibold">{s.c?.name}</div>
              <div className="mt-4 space-y-3">
                <Kpi label="Subscribers" value={(s.c?.subscribers ?? 0).toLocaleString()} />
                <Kpi label="Total views" value={s.views.toLocaleString()} />
                <Kpi label="Videos" value={s.videos} />
                <Kpi label="Engagement" value={`${s.engagement.toFixed(2)}%`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}