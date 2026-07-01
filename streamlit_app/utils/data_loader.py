"""CSV loading + normalization helpers."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_sample_videos() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "sample_videos.csv")
    df["published_at"] = pd.to_datetime(df["published_at"], utc=True, errors="coerce")
    return df


def load_sample_channel() -> dict:
    df = pd.read_csv(DATA_DIR / "sample_channel.csv")
    return df.iloc[0].to_dict()


def engagement_rate(df: pd.DataFrame) -> pd.Series:
    views = df["views"].replace(0, pd.NA)
    return ((df["likes"].fillna(0) + df["comments"].fillna(0)) / views * 100).fillna(0)


def with_engagement(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["engagement_rate"] = engagement_rate(out)
    out["month"] = out["published_at"].dt.to_period("M").astype(str)
    out["weekday"] = out["published_at"].dt.day_name()
    out["hour"] = out["published_at"].dt.hour
    return out


def filter_videos(
    df: pd.DataFrame,
    date_range: tuple | None = None,
    title_query: str = "",
    category: str | None = None,
    min_views: int = 0,
    min_likes: int = 0,
) -> pd.DataFrame:
    out = df.copy()
    if date_range and len(date_range) == 2 and all(date_range):
        start, end = pd.Timestamp(date_range[0], tz="UTC"), pd.Timestamp(date_range[1], tz="UTC")
        out = out[(out["published_at"] >= start) & (out["published_at"] <= end)]
    if title_query:
        out = out[out["title"].str.contains(title_query, case=False, na=False)]
    if category and category != "All":
        out = out[out["category"].astype(str) == category]
    out = out[out["views"].fillna(0) >= min_views]
    out = out[out["likes"].fillna(0) >= min_likes]
    return out