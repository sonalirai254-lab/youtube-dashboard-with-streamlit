import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Kpi } from "@/components/kpi";

export const Route = createFileRoute("/_authenticated/c/$channelId/overview")({
  head: () => ({ meta: [{ title: "Overview — Crixsoft" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { channelId } = useParams({ from: "/_authenticated/c/$channelId/overview" });

  const channel = useQuery({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*").eq("id", channelId).single();
      if (error) throw error;
      return data;
    },
  });

  const videos = useQuery({
    queryKey: ["videos", channelId],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("channel_id", channelId);
      if (error) throw error;
      return data;
    },
  });

  const metrics = useQuery({
    queryKey: ["metrics", channelId],
    queryFn: async () => {
      const { data, error } = await supabase.from("channel_metrics").select("*").eq("channel_id", channelId).order("date");
      if (error) throw error;
      return data;
    },
  });

  const totalViews = (videos.data ?? []).reduce((s, v) => s + (v.views ?? 0), 0);
  const totalLikes = (videos.data ?? []).reduce((s, v) => s + (v.likes ?? 0), 0);
  const totalComments = (videos.data ?? []).reduce((s, v) => s + (v.comments ?? 0), 0);
  const engagement = totalViews ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
  const topVideos = [...(videos.data ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="text-3xl font-bold">{channel.data?.name ?? "Channel"}</h1>
      <div className="mb-6 mt-1 flex gap-4 text-sm text-muted-foreground">
        <Link to="/c/$channelId/overview" params={{ channelId }} className="font-medium text-primary">Overview</Link>
        <Link to="/c/$channelId/videos" params={{ channelId }}>Videos</Link>
        <Link to="/c/$channelId/keywords" params={{ channelId }}>Keywords</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Subscribers" value={(channel.data?.subscribers ?? 0).toLocaleString()} />
        <Kpi label="Total views" value={totalViews.toLocaleString()} />
        <Kpi label="Videos" value={(videos.data ?? []).length.toLocaleString()} />
        <Kpi label="Engagement" value={`${engagement.toFixed(2)}%`} sub="(likes + comments) / views" />
      </div>

      {(metrics.data ?? []).length > 0 && (
        <div className="mt-8 rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Views over time</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={metrics.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Top 10 videos</h2>
        <ol className="space-y-2">
          {topVideos.map((v, i) => (
            <li key={v.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <span className="truncate"><span className="mr-2 text-muted-foreground">{i + 1}.</span>{v.title}</span>
              <span className="ml-4 font-mono text-sm">{(v.views ?? 0).toLocaleString()}</span>
            </li>
          ))}
          {topVideos.length === 0 && <li className="text-sm text-muted-foreground">No videos yet.</li>}
        </ol>
      </div>
    </div>
  );
}