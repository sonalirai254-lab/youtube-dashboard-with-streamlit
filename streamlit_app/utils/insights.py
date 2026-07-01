"""Auto-generated insights from the videos dataframe."""
from __future__ import annotations

import pandas as pd


def generate(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}
    best = df.loc[df["views"].idxmax()]
    worst = df.loc[df["views"].idxmin()]
    monthly_uploads = df.groupby("month").size()
    monthly_views = df.groupby("month")["views"].sum()
    fastest_growth = monthly_views.pct_change().fillna(0).idxmax() if len(monthly_views) > 1 else None

    return {
        "best_video": {"title": best["title"], "views": int(best["views"])},
        "worst_video": {"title": worst["title"], "views": int(worst["views"])},
        "avg_engagement": round(df["engagement_rate"].mean(), 2),
        "most_active_month": monthly_uploads.idxmax() if not monthly_uploads.empty else None,
        "fastest_growth_month": fastest_growth,
        "recommendations": _recommendations(df),
    }


def _recommendations(df: pd.DataFrame) -> list[str]:
    tips: list[str] = []
    top_hour = df.groupby("hour")["views"].mean().idxmax()
    top_day = df.groupby("weekday")["views"].mean().idxmax()
    tips.append(f"Best performing publish hour (UTC): {top_hour}:00 — schedule uploads around this window.")
    tips.append(f"Highest-view weekday: {top_day}. Consider concentrating releases here.")
    avg_eng = df["engagement_rate"].mean()
    if avg_eng < 3:
        tips.append("Engagement rate is below 3%. Add stronger hooks, CTAs, and pinned comments.")
    else:
        tips.append(f"Healthy engagement ({avg_eng:.1f}%). Reinvest into higher production formats.")
    if df["comments"].mean() < df["likes"].mean() * 0.02:
        tips.append("Comment-to-like ratio is low. Ask questions and reply to boost community signals.")
    return tips