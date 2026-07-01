"""Plotly chart helpers with a consistent Crixsoft theme."""
from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

GRADIENT = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]


def _theme(fig: go.Figure) -> go.Figure:
    fig.update_layout(
        template="plotly_dark",
        margin=dict(l=10, r=10, t=40, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, Segoe UI, sans-serif"),
        colorway=GRADIENT,
    )
    return fig


def bar_top_videos(df: pd.DataFrame, metric: str = "views", n: int = 10) -> go.Figure:
    top = df.nlargest(n, metric)[["title", metric]].iloc[::-1]
    fig = px.bar(top, x=metric, y="title", orientation="h",
                 title=f"Top {n} by {metric.title()}", color=metric,
                 color_continuous_scale="magma")
    return _theme(fig)


def line_upload_trend(df: pd.DataFrame) -> go.Figure:
    monthly = df.groupby("month").size().reset_index(name="uploads")
    fig = px.line(monthly, x="month", y="uploads", markers=True, title="Monthly Upload Trend")
    return _theme(fig)


def area_views_over_time(df: pd.DataFrame) -> go.Figure:
    d = df.sort_values("published_at").assign(cum_views=lambda x: x["views"].cumsum())
    fig = px.area(d, x="published_at", y="cum_views", title="Cumulative Views Over Time")
    return _theme(fig)


def pie_category_split(df: pd.DataFrame) -> go.Figure:
    counts = df["category"].fillna("Uncategorized").value_counts().reset_index()
    counts.columns = ["category", "count"]
    fig = px.pie(counts, names="category", values="count", hole=0.55,
                 title="Video Category Distribution")
    return _theme(fig)


def scatter_views_engagement(df: pd.DataFrame) -> go.Figure:
    fig = px.scatter(df, x="views", y="engagement_rate", size="likes", color="engagement_rate",
                     hover_data=["title"], title="Views vs Engagement",
                     color_continuous_scale="viridis")
    return _theme(fig)


def histogram_views(df: pd.DataFrame) -> go.Figure:
    fig = px.histogram(df, x="views", nbins=30, title="Views Distribution")
    return _theme(fig)


def treemap_categories(df: pd.DataFrame) -> go.Figure:
    fig = px.treemap(df.fillna({"category": "Uncategorized"}),
                     path=["category", "title"], values="views", title="Views Treemap")
    return _theme(fig)


def heatmap_weekday_hour(df: pd.DataFrame) -> go.Figure:
    pivot = df.pivot_table(index="weekday", columns="hour", values="views",
                            aggfunc="mean", fill_value=0)
    order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    pivot = pivot.reindex([d for d in order if d in pivot.index])
    fig = px.imshow(pivot, aspect="auto", title="Avg Views — Weekday × Hour",
                    color_continuous_scale="plasma")
    return _theme(fig)


def line_likes_trend(df: pd.DataFrame) -> go.Figure:
    monthly = df.groupby("month")["likes"].sum().reset_index()
    fig = px.line(monthly, x="month", y="likes", markers=True, title="Likes Trend")
    return _theme(fig)