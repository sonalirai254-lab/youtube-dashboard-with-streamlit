"""Thin wrapper around the YouTube Data API v3."""
from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

try:
    from googleapiclient.discovery import build
except ImportError:  # pragma: no cover
    build = None


def _client(api_key: str):
    if build is None:
        raise RuntimeError("google-api-python-client is not installed")
    return build("youtube", "v3", developerKey=api_key, cache_discovery=False)


def resolve_channel_id(api_key: str, query: str) -> str | None:
    """Accept a channel ID, @handle, or search term and return a channel ID."""
    yt = _client(api_key)
    q = query.strip().lstrip("@")
    if query.strip().startswith("UC") and len(query.strip()) == 24:
        return query.strip()
    resp = yt.search().list(part="snippet", q=q, type="channel", maxResults=1).execute()
    items = resp.get("items", [])
    return items[0]["snippet"]["channelId"] if items else None


def fetch_channel(api_key: str, channel_id: str) -> dict[str, Any]:
    yt = _client(api_key)
    resp = yt.channels().list(
        part="snippet,statistics,brandingSettings,contentDetails", id=channel_id
    ).execute()
    items = resp.get("items", [])
    if not items:
        raise ValueError(f"Channel not found: {channel_id}")
    it = items[0]
    stats = it.get("statistics", {})
    snip = it.get("snippet", {})
    branding = it.get("brandingSettings", {}).get("image", {})
    return {
        "channel_id": it["id"],
        "title": snip.get("title"),
        "description": snip.get("description"),
        "country": snip.get("country"),
        "published_at": snip.get("publishedAt"),
        "thumbnail": snip.get("thumbnails", {}).get("high", {}).get("url"),
        "banner": branding.get("bannerExternalUrl"),
        "subscribers": int(stats.get("subscriberCount", 0)),
        "total_views": int(stats.get("viewCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
        "uploads_playlist": it["contentDetails"]["relatedPlaylists"]["uploads"],
    }


def fetch_videos(api_key: str, uploads_playlist: str, max_videos: int = 200) -> pd.DataFrame:
    yt = _client(api_key)
    video_ids: list[str] = []
    page_token = None
    while len(video_ids) < max_videos:
        resp = yt.playlistItems().list(
            part="contentDetails", playlistId=uploads_playlist,
            maxResults=50, pageToken=page_token,
        ).execute()
        video_ids.extend(item["contentDetails"]["videoId"] for item in resp.get("items", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    video_ids = video_ids[:max_videos]

    rows: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = yt.videos().list(
            part="snippet,statistics,contentDetails", id=",".join(batch)
        ).execute()
        for it in resp.get("items", []):
            s, st, cd = it["snippet"], it.get("statistics", {}), it["contentDetails"]
            rows.append({
                "video_id": it["id"],
                "title": s.get("title"),
                "published_at": s.get("publishedAt"),
                "category_id": s.get("categoryId"),
                "tags": ",".join(s.get("tags", []) or []),
                "duration": cd.get("duration"),
                "views": int(st.get("viewCount", 0)),
                "likes": int(st.get("likeCount", 0)),
                "comments": int(st.get("commentCount", 0)),
            })
    df = pd.DataFrame(rows)
    if not df.empty:
        df["published_at"] = pd.to_datetime(df["published_at"], utc=True, errors="coerce")
    return df