import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCsv, pick, toInt, toNum } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Upload CSV — Crixsoft" }] }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [videosFile, setVideosFile] = useState<File | null>(null);
  const [metricsFile, setMetricsFile] = useState<File | null>(null);
  const [keywordsFile, setKeywordsFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !videosFile) {
      toast.error("Channel name and videos CSV are required.");
      return;
    }
    setBusy(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not signed in");

      const { data: channel, error: cErr } = await supabase
        .from("channels")
        .insert({ user_id: user.user.id, name, handle: handle || null })
        .select()
        .single();
      if (cErr) throw cErr;

      // videos
      const vRows = await parseCsv<Record<string, string>>(videosFile);
      const videos = vRows.map((r) => ({
        channel_id: channel.id,
        external_id: String(pick(r, "video_id", "id", "Content") ?? ""),
        title: String(pick(r, "title", "video title", "Video title") ?? "Untitled"),
        published_at: (() => {
          const v = pick(r, "published_at", "publish_time", "Video publish time", "date");
          if (!v) return null;
          const d = new Date(String(v));
          return isNaN(d.getTime()) ? null : d.toISOString();
        })(),
        views: toInt(pick(r, "views", "Views")),
        likes: toInt(pick(r, "likes", "Likes")),
        comments: toInt(pick(r, "comments", "Comments", "Comments added")),
        ctr: toNum(pick(r, "ctr", "Impressions click-through rate (%)")),
        avg_view_duration: toNum(pick(r, "avg_view_duration", "Average view duration")),
        duration_seconds: toInt(pick(r, "duration_seconds", "Duration")),
        category: pick(r, "category", "Category") ? String(pick(r, "category", "Category")) : null,
      }));
      if (videos.length) {
        const { error } = await supabase.from("videos").insert(videos);
        if (error) throw error;
      }

      const totalViews = videos.reduce((s, v) => s + v.views, 0);
      const totalSubs = toInt(pick(vRows[0] ?? {}, "subscribers", "Subscribers"));

      // metrics
      if (metricsFile) {
        const mRows = await parseCsv<Record<string, string>>(metricsFile);
        const metrics = mRows
          .map((r) => {
            const d = pick(r, "date", "Date");
            if (!d) return null;
            const parsed = new Date(String(d));
            if (isNaN(parsed.getTime())) return null;
            return {
              channel_id: channel.id,
              date: parsed.toISOString().slice(0, 10),
              subscribers: toInt(pick(r, "subscribers", "Subscribers")),
              views: toInt(pick(r, "views", "Views")),
              watch_time_minutes: toInt(pick(r, "watch_time_minutes", "Watch time (hours)", "Watch time (minutes)")),
            };
          })
          .filter(Boolean) as Array<{ channel_id: string; date: string; subscribers: number; views: number; watch_time_minutes: number }>;
        if (metrics.length) {
          const { error } = await supabase.from("channel_metrics").upsert(metrics, { onConflict: "channel_id,date" });
          if (error) throw error;
        }
      }

      // keywords
      if (keywordsFile) {
        const kRows = await parseCsv<Record<string, string>>(keywordsFile);
        const keywords = kRows
          .map((r) => {
            const term = pick(r, "term", "search_term", "Search term", "keyword");
            if (!term) return null;
            return {
              channel_id: channel.id,
              term: String(term),
              impressions: toInt(pick(r, "impressions", "Impressions")),
              clicks: toInt(pick(r, "clicks", "Views")),
              ctr: toNum(pick(r, "ctr", "CTR")),
            };
          })
          .filter(Boolean) as Array<{ channel_id: string; term: string; impressions: number; clicks: number; ctr: number }>;
        if (keywords.length) {
          const { error } = await supabase.from("keyword_metrics").insert(keywords);
          if (error) throw error;
        }
      }

      // update channel aggregates
      await supabase
        .from("channels")
        .update({ subscribers: totalSubs > 0 ? totalSubs : undefined })
        .eq("id", channel.id);

      toast.success(`Imported ${videos.length} videos`);
      navigate({ to: "/c/$channelId/overview", params: { channelId: channel.id } });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-3xl font-bold">Upload channel CSVs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Export from YouTube Studio → Analytics → Advanced mode → click the download arrow. We&apos;ll auto-map common columns.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border bg-card p-6">
        <div>
          <Label>Channel name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crixsoft Studios" required />
        </div>
        <div>
          <Label>Handle</Label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@crixsoft" />
        </div>
        <div>
          <Label>Videos CSV *</Label>
          <Input type="file" accept=".csv" onChange={(e) => setVideosFile(e.target.files?.[0] ?? null)} required />
          <p className="mt-1 text-xs text-muted-foreground">Columns: title, views, likes, comments, published_at…</p>
        </div>
        <div>
          <Label>Channel metrics CSV (optional)</Label>
          <Input type="file" accept=".csv" onChange={(e) => setMetricsFile(e.target.files?.[0] ?? null)} />
          <p className="mt-1 text-xs text-muted-foreground">Time-series: date, subscribers, views, watch_time_minutes</p>
        </div>
        <div>
          <Label>Traffic / keywords CSV (optional)</Label>
          <Input type="file" accept=".csv" onChange={(e) => setKeywordsFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Uploading…" : "Import channel"}
        </Button>
      </form>
    </div>
  );
}