import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/c/$channelId/videos")({
  head: () => ({ meta: [{ title: "Videos — Crixsoft" }] }),
  component: VideosPage,
});

function VideosPage() {
  const { channelId } = useParams({ from: "/_authenticated/c/$channelId/videos" });
  const [q, setQ] = useState("");
  const [minViews, setMinViews] = useState(0);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", channelId],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("channel_id", channelId);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    return videos
      .map((v) => ({
        ...v,
        engagement: v.views ? ((v.likes ?? 0) + (v.comments ?? 0)) / v.views * 100 : 0,
      }))
      .filter((v) => v.title.toLowerCase().includes(q.toLowerCase()) && (v.views ?? 0) >= minViews)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }, [videos, q, minViews]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
        <Link to="/c/$channelId/overview" params={{ channelId }}>Overview</Link>
        <Link to="/c/$channelId/videos" params={{ channelId }} className="font-medium text-primary">Videos</Link>
        <Link to="/c/$channelId/keywords" params={{ channelId }}>Keywords</Link>
      </div>
      <h1 className="text-3xl font-bold">Video analytics</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input type="number" placeholder="Min views" value={minViews || ""} onChange={(e) => setMinViews(Number(e.target.value) || 0)} />
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Views vs engagement</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" dataKey="views" name="Views" fontSize={12} />
              <YAxis type="number" dataKey="engagement" name="Engagement %" fontSize={12} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={rows} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2 text-right">Views</th>
              <th className="px-4 py-2 text-right">Likes</th>
              <th className="px-4 py-2 text-right">Comments</th>
              <th className="px-4 py-2 text-right">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="max-w-md truncate px-4 py-2">{v.title}</td>
                <td className="px-4 py-2 text-right font-mono">{(v.views ?? 0).toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{(v.likes ?? 0).toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{(v.comments ?? 0).toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{v.engagement.toFixed(2)}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>No videos match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}