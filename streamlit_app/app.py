from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import streamlit as st

from utils.charts import (
    area_views_over_time, bar_top_videos, heatmap_weekday_hour,
    histogram_views, line_likes_trend, line_upload_trend,
    pie_category_split, scatter_views_engagement, treemap_categories,
)
from utils.data_loader import (
    filter_videos, load_sample_channel, load_sample_videos, with_engagement,
)
from utils.insights import generate as generate_insights
from utils.report import build_pdf
from utils.youtube_api import fetch_channel, fetch_videos, resolve_channel_id

st.set_page_config(
    page_title="YouTube Analytics — Crixsoft",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

CSS = (Path(__file__).parent / "assets" / "style.css").read_text()
st.markdown(f"<style>{CSS}</style>", unsafe_allow_html=True)


def safe_text(value, default=""):
    if value is None:
        return default
    try:
        if pd.isna(value):
            return default
    except Exception:
        pass
    return str(value)


def safe_image(value):
    img = safe_text(value, "")
    return img if img.strip().lower() not in ["", "nan", "none"] else ""


def prepare_uploaded_csv(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    required_cols = {
        "title": "Uploaded Video",
        "published_at": datetime.today(),
        "views": 0,
        "likes": 0,
        "comments": 0,
        "category": "Uploaded CSV",
    }

    for col, default in required_cols.items():
        if col not in df.columns:
            df[col] = default

    df["published_at"] = pd.to_datetime(df["published_at"], errors="coerce")
    df["published_at"] = df["published_at"].fillna(pd.Timestamp.today())

    for col in ["views", "likes", "comments"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    df["title"] = df["title"].astype(str)
    df["category"] = df["category"].astype(str)

    return df


@st.cache_data(show_spinner="Fetching YouTube data…", ttl=1800)
def load_from_api(api_key: str, query: str, max_videos: int) -> tuple[dict, pd.DataFrame]:
    channel_id = resolve_channel_id(api_key, query)
    if not channel_id:
        raise ValueError(f"No channel found for '{query}'")
    channel = fetch_channel(api_key, channel_id)
    videos = fetch_videos(api_key, channel["uploads_playlist"], max_videos=max_videos)
    videos["category"] = videos.get("category_id", "").astype(str)
    return channel, videos


@st.cache_data(show_spinner=False)
def load_sample() -> tuple[dict, pd.DataFrame]:
    return load_sample_channel(), load_sample_videos()


with st.sidebar:
    st.markdown("### 🎬 Crixsoft")
    st.caption("YouTube Analytics Dashboard")
    st.divider()

    theme = st.radio("Theme", ["🌙 Dark", "☀️ Light"], horizontal=True)

    st.divider()
    source = st.radio("Data source", ["📁 Sample dataset", "📤 Upload CSV", "🔑 YouTube API v3"])

    uploaded_csv = None
    api_key, query, max_videos = None, None, 100

    if source == "📤 Upload CSV":
        uploaded_csv = st.file_uploader("Upload YouTube CSV", type=["csv"])
        st.caption("Required columns: title, published_at, views, likes, comments")

    if source.endswith("API v3"):
        api_key = st.text_input("API key", type="password", value=os.getenv("YOUTUBE_API_KEY", ""))
        query = st.text_input("Channel handle / ID / name", value="@MrBeast")
        max_videos = st.slider("Max videos", 25, 500, 100, step=25)

    st.divider()
    page = st.radio("Navigate", ["📊 Dashboard", "🎥 Channel Analysis", "📼 Video Analysis", "💡 Insights"])


try:
    if source.endswith("API v3") and api_key and query:
        channel, videos = load_from_api(api_key, query, max_videos)

    elif source == "📤 Upload CSV" and uploaded_csv is not None:
        channel = load_sample_channel()
        channel["title"] = "Uploaded YouTube CSV Analysis"
        channel["description"] = "Analytics generated from uploaded CSV file."
        videos = prepare_uploaded_csv(pd.read_csv(uploaded_csv))
        st.success("CSV uploaded successfully.")

    else:
        channel, videos = load_sample()

except Exception as exc:
    st.error(f"Could not load data: {exc}. Falling back to sample dataset.")
    channel, videos = load_sample()

videos = with_engagement(videos)
videos["published_at"] = pd.to_datetime(videos["published_at"], errors="coerce")
videos["published_at"] = videos["published_at"].fillna(pd.Timestamp.today())

videos["month"] = videos["published_at"].dt.to_period("M").astype(str)
videos["weekday"] = videos["published_at"].dt.day_name()
videos["hour"] = videos["published_at"].dt.hour

st.markdown(
    f"""
    <div class="crix-hero">
      <h1>{safe_text(channel.get('title'), 'YouTube Analytics')}</h1>
      <p>{safe_text(channel.get('description'), '')[:180]}</p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("🔍 Filters", expanded=False):
    c1, c2, c3, c4 = st.columns(4)

    dmin = videos["published_at"].min()
    dmax = videos["published_at"].max()

    with c1:
        date_range = st.date_input(
            "Date range",
            value=(
                dmin.date() if pd.notna(dmin) else datetime.today(),
                dmax.date() if pd.notna(dmax) else datetime.today(),
            ),
        )

    with c2:
        title_q = st.text_input("Title contains")

    with c3:
        cats = ["All"] + sorted(videos["category"].dropna().astype(str).unique().tolist())
        cat = st.selectbox("Category", cats)

    with c4:
        min_v = st.number_input("Min views", 0, step=1000, value=0)
        min_l = st.number_input("Min likes", 0, step=100, value=0)

filtered = filter_videos(
    videos,
    date_range=date_range if isinstance(date_range, tuple) else None,
    title_query=title_q,
    category=cat,
    min_views=int(min_v),
    min_likes=int(min_l),
)


def kpi(label: str, value: str, delta: str = "") -> None:
    st.markdown(
        f"""
        <div class="kpi-card">
            <div class="kpi-label">{label}</div>
            <div class="kpi-value">{value}</div>
            <div class="kpi-delta">{delta}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


if page == "📊 Dashboard":
    c = st.columns(3)

    with c[0]:
        kpi("Subscribers", f"{int(channel.get('subscribers', 0)):,}")
    with c[1]:
        kpi("Total Views", f"{int(channel.get('total_views', 0)):,}")
    with c[2]:
        kpi("Videos", f"{int(channel.get('video_count', len(videos))):,}")

    c = st.columns(3)

    with c[0]:
        kpi("Avg Views / Video", f"{int(filtered['views'].mean() or 0):,}")
    with c[1]:
        kpi("Avg Likes / Video", f"{int(filtered['likes'].mean() or 0):,}")
    with c[2]:
        kpi("Engagement Rate", f"{filtered['engagement_rate'].mean():.2f}%")

    st.plotly_chart(line_upload_trend(filtered), use_container_width=True)

    a, b = st.columns(2)
    with a:
        st.plotly_chart(area_views_over_time(filtered), use_container_width=True)
    with b:
        st.plotly_chart(pie_category_split(filtered), use_container_width=True)

    st.plotly_chart(heatmap_weekday_hour(filtered), use_container_width=True)


elif page == "🎥 Channel Analysis":
    ic1, ic2 = st.columns([1, 3])

    with ic1:
        thumbnail = safe_image(channel.get("thumbnail"))

        if thumbnail:
            st.image(thumbnail, width=180)
        else:
            st.info("No thumbnail available")

    with ic2:
        st.subheader(safe_text(channel.get("title"), ""))
        st.write(safe_text(channel.get("description"), "—") or "—")

        meta = st.columns(3)
        meta[0].metric("Country", safe_text(channel.get("country"), "n/a") or "n/a")
        meta[1].metric("Created", safe_text(channel.get("published_at"), "")[:10] or "n/a")

        freq = len(filtered) / max(1, filtered["month"].nunique())
        meta[2].metric("Uploads / month", f"{freq:.1f}")

    banner = safe_image(channel.get("banner"))

    if banner:
        st.image(banner, use_container_width=True)

    st.plotly_chart(line_upload_trend(filtered), use_container_width=True)


elif page == "📼 Video Analysis":
    tabs = st.tabs(["Most Viewed", "Most Liked", "Most Commented", "Recent", "Highest Engagement"])

    with tabs[0]:
        st.plotly_chart(bar_top_videos(filtered, "views"), use_container_width=True)

    with tabs[1]:
        st.plotly_chart(bar_top_videos(filtered, "likes"), use_container_width=True)

    with tabs[2]:
        st.plotly_chart(bar_top_videos(filtered, "comments"), use_container_width=True)

    with tabs[3]:
        st.dataframe(
            filtered.sort_values("published_at", ascending=False)[
                ["title", "published_at", "views", "likes", "comments"]
            ].head(20),
            use_container_width=True,
        )

    with tabs[4]:
        st.plotly_chart(bar_top_videos(filtered, "engagement_rate"), use_container_width=True)

    a, b = st.columns(2)

    with a:
        st.plotly_chart(scatter_views_engagement(filtered), use_container_width=True)

    with b:
        st.plotly_chart(histogram_views(filtered), use_container_width=True)

    st.plotly_chart(treemap_categories(filtered), use_container_width=True)
    st.plotly_chart(line_likes_trend(filtered), use_container_width=True)


elif page == "💡 Insights":
    ins = generate_insights(filtered)

    if not ins:
        st.info("No data to analyze — adjust filters.")
    else:
        c = st.columns(2)

        with c[0]:
            kpi("Best Video", safe_text(ins["best_video"]["title"])[:40], f"{ins['best_video']['views']:,} views")
            kpi("Worst Video", safe_text(ins["worst_video"]["title"])[:40], f"{ins['worst_video']['views']:,} views")

        with c[1]:
            kpi("Avg Engagement", f"{ins['avg_engagement']}%")
            kpi("Most Active Month", safe_text(ins.get("most_active_month"), "—"))

        st.subheader("Growth Recommendations")

        for tip in ins["recommendations"]:
            st.markdown(f"- {tip}")


st.divider()

c1, c2 = st.columns(2)

with c1:
    st.download_button(
        "⬇️ Download filtered CSV",
        filtered.to_csv(index=False).encode("utf-8"),
        file_name="videos_filtered.csv",
        mime="text/csv",
    )

with c2:
    try:
        pdf_bytes = build_pdf(channel, filtered, generate_insights(filtered))

        st.download_button(
            "📄 Download PDF report",
            pdf_bytes,
            file_name="youtube_report.pdf",
            mime="application/pdf",
        )

    except Exception as exc:
        st.caption(f"PDF export unavailable: {exc}")

st.caption("Built with ❤ by Crixsoft · YouTube Data API v3 · Streamlit + Plotly")