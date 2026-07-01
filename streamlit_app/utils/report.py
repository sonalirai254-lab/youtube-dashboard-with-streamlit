"""Generate a downloadable PDF report."""
from __future__ import annotations

from io import BytesIO

import pandas as pd
from fpdf import FPDF


def build_pdf(channel: dict, df: pd.DataFrame, insights: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "YouTube Analytics Report", ln=True)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, f"Channel: {channel.get('title','')}", ln=True)
    pdf.cell(0, 8, f"Subscribers: {int(channel.get('subscribers',0)):,}", ln=True)
    pdf.cell(0, 8, f"Total views: {int(channel.get('total_views',0)):,}", ln=True)
    pdf.cell(0, 8, f"Videos analyzed: {len(df)}", ln=True)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Key insights", ln=True)
    pdf.set_font("Helvetica", "", 11)
    if insights:
        pdf.multi_cell(0, 7, f"Best video: {insights['best_video']['title']} ({insights['best_video']['views']:,} views)")
        pdf.multi_cell(0, 7, f"Worst video: {insights['worst_video']['title']} ({insights['worst_video']['views']:,} views)")
        pdf.multi_cell(0, 7, f"Average engagement: {insights['avg_engagement']}%")
        pdf.multi_cell(0, 7, f"Most active month: {insights.get('most_active_month','n/a')}")
        pdf.multi_cell(0, 7, f"Fastest growth month: {insights.get('fastest_growth_month','n/a')}")
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Recommendations", ln=True)
        pdf.set_font("Helvetica", "", 11)
        for tip in insights.get("recommendations", []):
            pdf.multi_cell(0, 6, f"- {tip}")

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Top 10 videos", ln=True)
    pdf.set_font("Helvetica", "", 10)
    top = df.nlargest(10, "views")[["title", "views", "likes", "comments"]]
    for _, row in top.iterrows():
        title = str(row["title"])[:70]
        pdf.multi_cell(0, 6, f"{title}  |  {int(row['views']):,} views  |  {int(row['likes']):,} likes")

    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()