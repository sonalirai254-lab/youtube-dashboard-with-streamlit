import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/c/$channelId/keywords")({
  head: () => ({ meta: [{ title: "Keywords — Crixsoft" }] }),
  component: KeywordsPage,
});

function KeywordsPage() {
  const { channelId } = useParams({ from: "/_authenticated/c/$channelId/keywords" });
  const { data = [] } = useQuery({
    queryKey: ["keywords", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keyword_metrics")
        .select("*")
        .eq("channel_id", channelId)
        .order("impressions", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
        <Link to="/c/$channelId/overview" params={{ channelId }}>Overview</Link>
        <Link to="/c/$channelId/videos" params={{ channelId }}>Videos</Link>
        <Link to="/c/$channelId/keywords" params={{ channelId }} className="font-medium text-primary">Keywords</Link>
      </div>
      <h1 className="text-3xl font-bold">Keyword & search insights</h1>

      {data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No keyword data. Upload a traffic-source CSV to see search insights here.
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-2xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">Top search terms by impressions</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={data.slice(0, 15)} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="term" fontSize={12} width={120} />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2">Term</th>
                  <th className="px-4 py-2 text-right">Impressions</th>
                  <th className="px-4 py-2 text-right">Clicks</th>
                  <th className="px-4 py-2 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="px-4 py-2">{k.term}</td>
                    <td className="px-4 py-2 text-right font-mono">{(k.impressions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">{(k.clicks ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">{Number(k.ctr ?? 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}